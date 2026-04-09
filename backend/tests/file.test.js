/**
 * File Controller Tests
 * Tests: updateUser (mass assignment fix), deleteAllUsers, updateUserStatusByEmail
 */

import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockCountDocuments = jest.fn();
const mockDeleteMany = jest.fn();
const mockUpdateOne = jest.fn();

jest.unstable_mockModule('../model/filedata.model.js', () => ({
  UserCollection: {
    findByIdAndUpdate: mockFindByIdAndUpdate,
    findByIdAndDelete: mockFindByIdAndDelete,
    findOneAndUpdate: mockFindOneAndUpdate,
    countDocuments: mockCountDocuments,
    deleteMany: mockDeleteMany,
    updateOne: mockUpdateOne,
  },
}));

const { updateUser, deleteUser, deleteAllUsers, updateUserStatusByEmail } =
  await import('../controller/file.controller.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ── updateUser (mass assignment fix) ─────────────────────────────────────────

describe('updateUser - mass assignment prevention', () => {
  beforeEach(() => jest.clearAllMocks());

  test('only updates whitelisted fields', async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: 'u1', firstName: 'John' });
    const req = {
      params: { id: 'u1' },
      body: {
        firstName: 'John',
        lastName: 'Doe',
        // These should be stripped:
        event: 'malicious_event_id',
        __v: 99,
        _id: 'overwrite_id',
      },
      userId: 'admin1',
    };
    const res = mockRes();
    await updateUser(req, res);
    const updateArg = mockFindByIdAndUpdate.mock.calls[0][1];
    expect(updateArg).not.toHaveProperty('event');
    expect(updateArg).not.toHaveProperty('__v');
    expect(updateArg).not.toHaveProperty('_id');
    expect(updateArg).toHaveProperty('firstName', 'John');
    expect(updateArg).toHaveProperty('lastName', 'Doe');
  });

  test('does not include undefined fields in update', async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
    const req = {
      params: { id: 'u1' },
      body: { firstName: 'Jane' }, // only firstName provided
      userId: 'admin1',
    };
    const res = mockRes();
    await updateUser(req, res);
    const updateArg = mockFindByIdAndUpdate.mock.calls[0][1];
    // Should only have firstName, not other undefined fields
    expect(Object.keys(updateArg)).toEqual(['firstName']);
  });

  test('returns 404 when user not found', async () => {
    mockFindByIdAndUpdate.mockResolvedValue(null);
    const req = { params: { id: 'ghost' }, body: { firstName: 'X' }, userId: 'a1' };
    const res = mockRes();
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful update', async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: 'u1', firstName: 'John' });
    const req = { params: { id: 'u1' }, body: { firstName: 'John' }, userId: 'a1' };
    const res = mockRes();
    await updateUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('sets giftBy when giftCollected is true', async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
    mockUpdateOne.mockResolvedValue({});
    const req = {
      params: { id: 'u1' },
      body: { giftCollected: true },
      userId: 'staff1',
    };
    const res = mockRes();
    await updateUser(req, res);
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: 'u1' },
      { $set: { giftBy: 'staff1' } }
    );
  });
});

// ── deleteAllUsers ────────────────────────────────────────────────────────────

describe('deleteAllUsers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when event id is missing', async () => {
    const req = { params: { event: '' } };
    const res = mockRes();
    await deleteAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 200 with deletedCount 0 when no users exist', async () => {
    mockCountDocuments.mockResolvedValueOnce(0);
    const req = { params: { event: 'event123' } };
    const res = mockRes();
    await deleteAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ deletedCount: 0 }));
  });

  test('deletes users and returns correct count', async () => {
    mockCountDocuments
      .mockResolvedValueOnce(5)  // before
      .mockResolvedValueOnce(0); // after
    mockDeleteMany.mockResolvedValue({ deletedCount: 5 });
    const req = { params: { event: 'event123' } };
    const res = mockRes();
    await deleteAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ deletedCount: 5 }));
  });
});

// ── updateUserStatusByEmail ───────────────────────────────────────────────────

describe('updateUserStatusByEmail', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, X_API_KEY: 'valid-key-123' };
  });

  afterAll(() => { process.env = OLD_ENV; });

  test('returns 401 when API key is missing', async () => {
    const req = { body: { email: 'a@a.com', status: 'completed' }, headers: {} };
    const res = mockRes();
    await updateUserStatusByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 when API key is wrong', async () => {
    const req = {
      body: { email: 'a@a.com', status: 'completed' },
      headers: { 'x-api-key': 'wrong-key' },
    };
    const res = mockRes();
    await updateUserStatusByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 400 when email is missing', async () => {
    const req = {
      body: { status: 'completed' },
      headers: { 'x-api-key': 'valid-key-123' },
    };
    const res = mockRes();
    await updateUserStatusByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 for invalid status value', async () => {
    const req = {
      body: { email: 'a@a.com', status: 'unknown' },
      headers: { 'x-api-key': 'valid-key-123' },
    };
    const res = mockRes();
    await updateUserStatusByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when user not found', async () => {
    mockFindOneAndUpdate.mockResolvedValue(null);
    const req = {
      body: { email: 'ghost@ghost.com', status: 'completed' },
      headers: { 'x-api-key': 'valid-key-123' },
    };
    const res = mockRes();
    await updateUserStatusByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful status update', async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      email: 'a@a.com',
      status: 'completed',
      firstName: 'John',
      lastName: 'Doe',
    });
    const req = {
      body: { email: 'a@a.com', status: 'completed' },
      headers: { 'x-api-key': 'valid-key-123' },
    };
    const res = mockRes();
    await updateUserStatusByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('accepts all valid status values', async () => {
    const validStatuses = ['pending', 'completed', 'not-available', 'removed'];
    for (const status of validStatuses) {
      jest.clearAllMocks();
      mockFindOneAndUpdate.mockResolvedValue({ email: 'a@a.com', status, firstName: 'J', lastName: 'D' });
      const req = {
        body: { email: 'a@a.com', status },
        headers: { 'x-api-key': 'valid-key-123' },
      };
      const res = mockRes();
      await updateUserStatusByEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    }
  });
});

// ── deleteUser ────────────────────────────────────────────────────────────────

describe('deleteUser (attendee)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when attendee not found', async () => {
    mockFindByIdAndDelete.mockResolvedValue(null);
    const req = { params: { id: 'ghost' } };
    const res = mockRes();
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful delete', async () => {
    mockFindByIdAndDelete.mockResolvedValue({ _id: 'u1' });
    const req = { params: { id: 'u1' } };
    const res = mockRes();
    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
