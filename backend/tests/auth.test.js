/**
 * Auth Controller Tests
 * Tests: signup, login, logout, checkAuth, usersList
 */

import { jest } from '@jest/globals';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockUserSave = jest.fn();
const mockUserCreate = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFind = jest.fn();
const mockEventFindById = jest.fn();
const mockEventSave = jest.fn();

jest.unstable_mockModule('../model/auth.model.js', () => ({
  User: {
    findOne: mockUserFindOne,
    findById: mockUserFindById,
    find: mockUserFind,
    create: mockUserCreate,
  },
}));

jest.unstable_mockModule('../model/event.model.js', () => ({
  Events: { findById: mockEventFindById },
}));

jest.unstable_mockModule('../utils/generateToken.js', () => ({
  generateTokenAndCookie: jest.fn(),
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn(),
  },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn(),
    sign: jest.fn().mockReturnValue('mock_token'),
  },
}));

jest.unstable_mockModule('mongoose', () => ({
  default: {
    Types: {
      ObjectId: { isValid: jest.fn().mockReturnValue(true) },
    },
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

const { signup, login, logout, checkAuth, usersList } =
  await import('../controller/auth.controller.js');
const bcrypt = (await import('bcrypt')).default;
const jwt = (await import('jsonwebtoken')).default;

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// ── signup ────────────────────────────────────────────────────────────────────

describe('signup', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when required fields are missing', async () => {
    const req = { body: { username: '', email: '', password: '' }, user: null };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('returns 400 when email already registered', async () => {
    mockUserFindOne.mockResolvedValueOnce({ email: 'test@test.com' }).mockResolvedValueOnce(null);
    const req = { body: { username: 'user1', email: 'test@test.com', password: 'pass123' }, user: null };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Email already registered' }));
  });

  test('returns 400 when username already taken', async () => {
    mockUserFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ username: 'user1' });
    const req = { body: { username: 'user1', email: 'new@test.com', password: 'pass123' }, user: null };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Username already taken' }));
  });

  test('returns 403 when non-admin tries to create admin account', async () => {
    const req = {
      body: { username: 'hacker', email: 'h@h.com', password: 'pass123', role: 'admin' },
      user: { role: 'viewer' },
    };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Only admins can create admin accounts' }));
  });

  test('returns 403 when unauthenticated user tries to create admin account', async () => {
    const req = {
      body: { username: 'hacker', email: 'h@h.com', password: 'pass123', role: 'admin' },
      user: null,
    };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('allows admin to create admin account', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      _doc: { _id: '123', username: 'newadmin', email: 'a@a.com', role: 'admin' },
    });
    const req = {
      body: { username: 'newadmin', email: 'a@a.com', password: 'pass123', role: 'admin' },
      user: { role: 'admin' },
    };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('creates viewer account without role field (defaults to viewer)', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      _doc: { _id: '123', username: 'viewer1', email: 'v@v.com', role: 'viewer' },
    });
    const req = {
      body: { username: 'viewer1', email: 'v@v.com', password: 'pass123' },
      user: null,
    };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockUserCreate).toHaveBeenCalledWith(expect.objectContaining({ role: 'viewer' }));
  });

  test('returns 400 for invalid role value', async () => {
    const req = {
      body: { username: 'u', email: 'e@e.com', password: 'p', role: 'superuser' },
      user: null,
    };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid role specified' }));
  });

  test('does not return password in response', async () => {
    mockUserFindOne.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      _doc: { _id: '1', username: 'u', email: 'e@e.com', password: 'hashed', role: 'viewer' },
    });
    const req = { body: { username: 'u', email: 'e@e.com', password: 'pass' }, user: null };
    const res = mockRes();
    await signup(req, res);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.user).not.toHaveProperty('password');
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when user not found', async () => {
    mockUserFindOne.mockResolvedValue(null);
    const req = { body: { email: 'no@no.com', password: 'pass' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User Not Found' }));
  });

  test('returns 400 for wrong password', async () => {
    mockUserFindOne.mockResolvedValue({ _id: '1', password: 'hashed', _doc: {} });
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: 'u@u.com', password: 'wrong' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid Credentials' }));
  });

  test('returns 200 and sets cookie on valid credentials', async () => {
    const mockUser = {
      _id: 'user123',
      password: 'hashed',
      lastLogin: null,
      save: jest.fn(),
      _doc: { _id: 'user123', username: 'u', email: 'u@u.com', password: 'hashed' },
    };
    mockUserFindOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    const req = { body: { email: 'u@u.com', password: 'correct' } };
    const res = mockRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('does not return password in login response', async () => {
    const mockUser = {
      _id: 'user123',
      password: 'hashed',
      lastLogin: null,
      save: jest.fn(),
      _doc: { _id: 'user123', username: 'u', email: 'u@u.com', password: 'hashed' },
    };
    mockUserFindOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    const req = { body: { email: 'u@u.com', password: 'correct' } };
    const res = mockRes();
    await login(req, res);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.user.password).toBeUndefined();
  });

  test('reads from req.body not req.body.email (the original bug)', async () => {
    // If the bug were still present, email would be undefined and user would not be found
    mockUserFindOne.mockResolvedValue(null);
    const req = { body: { email: 'test@test.com', password: 'pass' } };
    const res = mockRes();
    await login(req, res);
    // Should have called findOne with the actual email string, not undefined
    expect(mockUserFindOne).toHaveBeenCalledWith({ email: 'test@test.com' });
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe('logout', () => {
  test('clears cookie and returns 200', async () => {
    const req = {};
    const res = mockRes();
    await logout(req, res);
    expect(res.clearCookie).toHaveBeenCalledWith('token');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ── checkAuth ─────────────────────────────────────────────────────────────────

describe('checkAuth', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 when no token in cookies', async () => {
    const req = { cookies: {} };
    const res = mockRes();
    await checkAuth(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ authenticated: false });
  });

  test('returns 401 for malformed/invalid token (no crash)', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });
    const req = { cookies: { token: 'bad.token.here' } };
    const res = mockRes();
    await checkAuth(req, res);
    // Must not throw — must return 401 gracefully
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ authenticated: false });
  });

  test('returns 401 when user not found in DB', async () => {
    jwt.verify.mockReturnValue({ userId: 'ghost123' });
    mockUserFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const req = { cookies: { token: 'valid.token' } };
    const res = mockRes();
    await checkAuth(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 200 with user when token is valid', async () => {
    jwt.verify.mockReturnValue({ userId: 'user123' });
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'user123', username: 'u', role: 'viewer' }),
    });
    const req = { cookies: { token: 'valid.token' } };
    const res = mockRes();
    await checkAuth(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ authenticated: true }));
  });
});

// ── usersList ─────────────────────────────────────────────────────────────────

describe('usersList', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 when req.user is missing (unauthenticated)', async () => {
    const req = { user: null };
    const res = mockRes();
    await usersList(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns users list when authenticated', async () => {
    mockUserFind.mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { username: 'a', email: 'a@a.com', role: 'viewer' },
      ]),
    });
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    await usersList(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
