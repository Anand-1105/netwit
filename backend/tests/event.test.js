/**
 * Event Controller Tests
 * Tests: createEvent, getAllEvents, getEventById, deleteEvent, updateEvent
 */

import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockEventSave = jest.fn();
const mockEventFindById = jest.fn();
const mockEventFind = jest.fn();
const mockEventFindByIdAndDelete = jest.fn();
const mockEventFindByIdAndUpdate = jest.fn();

const MockEvent = jest.fn().mockImplementation((data) => ({
  ...data,
  save: mockEventSave,
}));
MockEvent.findById = mockEventFindById;
MockEvent.find = mockEventFind;
MockEvent.findByIdAndDelete = mockEventFindByIdAndDelete;
MockEvent.findByIdAndUpdate = mockEventFindByIdAndUpdate;

const mockUserFindById = jest.fn();

jest.unstable_mockModule('../model/event.model.js', () => ({ Events: MockEvent }));
jest.unstable_mockModule('../model/auth.model.js', () => ({
  User: { findById: mockUserFindById },
}));
jest.unstable_mockModule('../model/Slots.js', () => ({ Slots: { aggregate: jest.fn() } }));
jest.unstable_mockModule('../model/filedata.model.js', () => ({
  UserCollection: { aggregate: jest.fn(), find: jest.fn() },
}));
jest.unstable_mockModule('mongoose', () => ({
  default: {
    Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
  },
}));
jest.unstable_mockModule('fs', () => ({
  default: {
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    unlinkSync: jest.fn(),
  },
}));
jest.unstable_mockModule('multer', () => ({
  default: Object.assign(
    jest.fn(() => ({ single: jest.fn() })),
    {
      diskStorage: jest.fn().mockReturnValue({}),
      memoryStorage: jest.fn().mockReturnValue({}),
    }
  ),
}));

const { createEvent, getAllEvents, getEventById, deleteEvent, updateEvent } =
  await import('../controller/event.controller.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ── createEvent ───────────────────────────────────────────────────────────────

describe('createEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when title is missing', async () => {
    const req = {
      body: { assignedTo: ['u1'], slotGap: 30 },
      userId: 'admin1',
      file: null,
    };
    const res = mockRes();
    await createEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when assignedTo is missing', async () => {
    const req = {
      body: { title: 'Test Event', slotGap: 30 },
      userId: 'admin1',
      file: null,
    };
    const res = mockRes();
    await createEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('uses req.userId as createdBy (not req.body.createdBy)', async () => {
    mockEventSave.mockResolvedValue({});
    const savedEvent = { _id: 'e1', title: 'Test', createdBy: 'admin1' };
    mockEventSave.mockResolvedValue(savedEvent);

    const req = {
      body: {
        title: 'Test Event',
        assignedTo: ['u1'],
        slotGap: 30,
        createdBy: 'SPOOFED_ID', // should be ignored
      },
      userId: 'admin1', // this should be used
      file: null,
    };
    const res = mockRes();
    await createEvent(req, res);

    // The MockEvent constructor should have been called with createdBy = 'admin1'
    const constructorCall = MockEvent.mock.calls[0][0];
    expect(constructorCall.createdBy).toBe('admin1');
    expect(constructorCall.createdBy).not.toBe('SPOOFED_ID');
  });

  test('returns 201 on successful creation', async () => {
    const savedEvent = { _id: 'e1', title: 'Test Event' };
    mockEventSave.mockResolvedValue(savedEvent);
    const req = {
      body: { title: 'Test Event', assignedTo: ['u1'], slotGap: 30 },
      userId: 'admin1',
      file: null,
    };
    const res = mockRes();
    await createEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// ── getAllEvents ──────────────────────────────────────────────────────────────

describe('getAllEvents', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when user not found', async () => {
    mockUserFindById.mockResolvedValue(null);
    const req = { userId: 'ghost' };
    const res = mockRes();
    await getAllEvents(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('admin sees all events (no assignedTo filter)', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'a1', role: 'admin' });
    const mockPopulate = jest.fn().mockReturnThis();
    mockEventFind.mockReturnValue({ populate: mockPopulate.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) }) });
    const req = { userId: 'a1' };
    const res = mockRes();
    await getAllEvents(req, res);
    // Admin: find called with empty query {}
    expect(mockEventFind).toHaveBeenCalledWith({});
  });

  test('non-admin only sees assigned events', async () => {
    mockUserFindById.mockResolvedValue({ _id: 'v1', role: 'viewer' });
    const mockPopulate = jest.fn().mockReturnThis();
    mockEventFind.mockReturnValue({ populate: mockPopulate.mockReturnValue({ populate: jest.fn().mockResolvedValue([]) }) });
    const req = { userId: 'v1' };
    const res = mockRes();
    await getAllEvents(req, res);
    expect(mockEventFind).toHaveBeenCalledWith({ assignedTo: 'v1' });
  });
});

// ── getEventById ──────────────────────────────────────────────────────────────

describe('getEventById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid ObjectId', async () => {
    const mongoose = (await import('mongoose')).default;
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);
    const req = { params: { id: 'not-valid' } };
    const res = mockRes();
    await getEventById(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when event not found', async () => {
    const mongoose = (await import('mongoose')).default;
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockPopulate = jest.fn().mockReturnThis();
    mockEventFindById.mockReturnValue({ populate: mockPopulate.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) }) });
    const req = { params: { id: 'valid123' } };
    const res = mockRes();
    await getEventById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with event data', async () => {
    const mongoose = (await import('mongoose')).default;
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    const mockPopulate = jest.fn().mockReturnThis();
    mockEventFindById.mockReturnValue({
      populate: mockPopulate.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ _id: 'e1', title: 'Test' }),
      }),
    });
    const req = { params: { id: 'e1' } };
    const res = mockRes();
    await getEventById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── deleteEvent ───────────────────────────────────────────────────────────────

describe('deleteEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when event not found', async () => {
    const mongoose = (await import('mongoose')).default;
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    mockEventFindByIdAndDelete.mockResolvedValue(null);
    const req = { params: { id: 'e1' } };
    const res = mockRes();
    await deleteEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful delete', async () => {
    const mongoose = (await import('mongoose')).default;
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    mockEventFindByIdAndDelete.mockResolvedValue({ _id: 'e1' });
    const req = { params: { id: 'e1' } };
    const res = mockRes();
    await deleteEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── updateEvent ───────────────────────────────────────────────────────────────

describe('updateEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when event not found', async () => {
    mockEventFindByIdAndUpdate.mockResolvedValue(null);
    const req = { params: { id: 'e1' }, body: { title: 'New Title' } };
    const res = mockRes();
    await updateEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful update', async () => {
    mockEventFindByIdAndUpdate.mockResolvedValue({ _id: 'e1', title: 'New Title' });
    const req = { params: { id: 'e1' }, body: { title: 'New Title' } };
    const res = mockRes();
    await updateEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
