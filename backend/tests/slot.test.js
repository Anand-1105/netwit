/**
 * Slot Controller Tests
 * Tests: bookSlot, deleteSlot, toggleCompletion, getAllBookedSlots, getCompanyData
 */

import { jest } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSlotFindOne = jest.fn();
const mockSlotFindOneAndDelete = jest.fn();
const mockSlotFindByIdAndUpdate = jest.fn();
const mockSlotFind = jest.fn();
const mockSlotAggregate = jest.fn();
const mockSlotSave = jest.fn();
const mockSlotPopulate = jest.fn();

const MockSlot = jest.fn().mockImplementation((data) => ({
  ...data,
  save: mockSlotSave,
}));
MockSlot.findOne = mockSlotFindOne;
MockSlot.findOneAndDelete = mockSlotFindOneAndDelete;
MockSlot.findByIdAndUpdate = mockSlotFindByIdAndUpdate;
MockSlot.find = mockSlotFind;
MockSlot.aggregate = mockSlotAggregate;

const mockUserFindByIdAndUpdate = jest.fn();

jest.unstable_mockModule('../model/Slots.js', () => ({ Slots: MockSlot }));
jest.unstable_mockModule('../model/filedata.model.js', () => ({
  UserCollection: { findByIdAndUpdate: mockUserFindByIdAndUpdate },
}));
jest.unstable_mockModule('mongoose', () => ({
  default: {
    Types: { ObjectId: jest.fn(id => id) },
  },
}));

const { bookSlot, deleteSlot, toggleCompletion, getAllBookedSlots, getCompanyData } =
  await import('../controller/slot.controller.js');

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ── bookSlot ──────────────────────────────────────────────────────────────────

describe('bookSlot', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when required fields are missing', async () => {
    const req = { body: { userId: 'u1', company: '', event: 'e1', timeSlot: '' } };
    const res = mockRes();
    await bookSlot(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when user already booked this time slot', async () => {
    mockSlotFindOne.mockResolvedValueOnce({ _id: 'existing' });
    const req = { body: { userId: 'u1', company: 'CompA', event: 'e1', timeSlot: '10:00' } };
    const res = mockRes();
    await bookSlot(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('already booked') }));
  });

  test('returns 400 when company+time already taken by another user', async () => {
    mockSlotFindOne
      .mockResolvedValueOnce(null)  // no existing user+time slot
      .mockResolvedValueOnce({ _id: 'taken' }); // company+time taken
    const req = { body: { userId: 'u1', company: 'CompA', event: 'e1', timeSlot: '10:00' } };
    const res = mockRes();
    await bookSlot(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('already booked for the selected company') }));
  });

  test('returns 400 when user already has a slot with same company', async () => {
    mockSlotFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ _id: 'sameCompany' });
    const req = { body: { userId: 'u1', company: 'CompA', event: 'e1', timeSlot: '10:00' } };
    const res = mockRes();
    await bookSlot(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('same company') }));
  });

  test('returns 201 on successful booking', async () => {
    mockSlotFindOne.mockResolvedValue(null);
    mockSlotSave.mockResolvedValue({});
    mockUserFindByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
    const req = { body: { userId: 'u1', company: 'CompA', event: 'e1', timeSlot: '10:00' } };
    const res = mockRes();
    await bookSlot(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Slot booked successfully' }));
  });

  test('returns 409 on duplicate key error (race condition)', async () => {
    mockSlotFindOne.mockResolvedValue(null);
    mockSlotSave.mockRejectedValue({ code: 11000 });
    mockUserFindByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
    const req = { body: { userId: 'u1', company: 'CompA', event: 'e1', timeSlot: '10:00' } };
    const res = mockRes();
    await bookSlot(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('just taken') }));
  });

  test('updates user status to scheduled on success', async () => {
    mockSlotFindOne.mockResolvedValue(null);
    mockSlotSave.mockResolvedValue({});
    mockUserFindByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
    const req = { body: { userId: 'u1', company: 'CompA', event: 'e1', timeSlot: '10:00' } };
    const res = mockRes();
    await bookSlot(req, res);
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('u1', { status: 'scheduled' });
  });
});

// ── deleteSlot ────────────────────────────────────────────────────────────────

describe('deleteSlot', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when required fields are missing', async () => {
    const req = { params: { id: 'u1' }, body: { slotTime: '', event: '' } };
    const res = mockRes();
    await deleteSlot(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when slot not found', async () => {
    mockSlotFindOneAndDelete.mockResolvedValue(null);
    const req = { params: { id: 'u1' }, body: { slotTime: '10:00', event: 'e1' } };
    const res = mockRes();
    await deleteSlot(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 and resets user status to pending on success', async () => {
    mockSlotFindOneAndDelete.mockResolvedValue({ _id: 's1', userId: 'u1' });
    mockUserFindByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
    const req = { params: { id: 'u1' }, body: { slotTime: '10:00', event: 'e1' } };
    const res = mockRes();
    await deleteSlot(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('u1', { status: 'pending' });
  });
});

// ── toggleCompletion ──────────────────────────────────────────────────────────

describe('toggleCompletion', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when completed is not a boolean', async () => {
    const req = { params: { id: 's1' }, body: { completed: 'yes' } };
    const res = mockRes();
    await toggleCompletion(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when slot not found', async () => {
    mockSlotFindByIdAndUpdate.mockResolvedValue(null);
    const req = { params: { id: 's1' }, body: { completed: true } };
    const res = mockRes();
    await toggleCompletion(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('sets user status to completed when completed=true', async () => {
    mockSlotFindByIdAndUpdate.mockResolvedValue({ _id: 's1', userId: 'u1', completed: true });
    mockUserFindByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
    const req = { params: { id: 's1' }, body: { completed: true } };
    const res = mockRes();
    await toggleCompletion(req, res);
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('u1', { status: 'completed' });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('sets user status to scheduled when completed=false', async () => {
    mockSlotFindByIdAndUpdate.mockResolvedValue({ _id: 's1', userId: 'u1', completed: false });
    mockUserFindByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
    const req = { params: { id: 's1' }, body: { completed: false } };
    const res = mockRes();
    await toggleCompletion(req, res);
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('u1', { status: 'scheduled' });
  });
});

// ── getAllBookedSlots ──────────────────────────────────────────────────────────

describe('getAllBookedSlots', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when event id is missing', async () => {
    const req = { body: {} };
    const res = mockRes();
    await getAllBookedSlots(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns slots for valid event', async () => {
    mockSlotFind.mockResolvedValue([{ _id: 's1', company: 'A' }]);
    const req = { body: { event: 'e1' } };
    const res = mockRes();
    await getAllBookedSlots(req, res);
    expect(res.json).toHaveBeenCalledWith([{ _id: 's1', company: 'A' }]);
  });
});

// ── getCompanyData ────────────────────────────────────────────────────────────

describe('getCompanyData', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when event is missing', async () => {
    const req = { params: { company: 'CompA' }, body: {} };
    const res = mockRes();
    await getCompanyData(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('filters by company name (not returning all slots)', async () => {
    const mockPopulate = jest.fn().mockResolvedValue([{ _id: 's1' }]);
    mockSlotFind.mockReturnValue({ populate: mockPopulate });
    const req = { params: { company: 'CompA' }, body: { event: 'e1' } };
    const res = mockRes();
    await getCompanyData(req, res);
    // Verify find was called with a company filter
    const findCall = mockSlotFind.mock.calls[0][0];
    expect(findCall).toHaveProperty('company');
    expect(findCall.company).toHaveProperty('$regex');
  });

  test('escapes special regex characters in company name', async () => {
    const mockPopulate = jest.fn().mockResolvedValue([]);
    mockSlotFind.mockReturnValue({ populate: mockPopulate });
    const req = { params: { company: 'Comp.A+B' }, body: { event: 'e1' } };
    const res = mockRes();
    await getCompanyData(req, res);
    const findCall = mockSlotFind.mock.calls[0][0];
    // The regex string should have escaped the . and +
    const regexStr = findCall.company.$regex;
    expect(regexStr).not.toContain('.A+B'); // raw unescaped chars should not appear
  });
});
