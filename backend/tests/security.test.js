/**
 * Security Tests
 * Tests: route protection, regex escaping, API key validation, role enforcement
 */

import { jest } from '@jest/globals';

// ── escapeRegex unit tests ────────────────────────────────────────────────────
// We test the escapeRegex logic directly by importing the controller
// and checking that special chars in company names don't break the regex

describe('escapeRegex - ReDoS prevention', () => {
  // Replicate the escapeRegex function as it exists in the controllers
  const escapeRegex = (s) =>
    s.split('').map(c => '.+*?^${}()|[]\\'.indexOf(c) !== -1 ? '\\' + c : c).join('');

  test('escapes dot character', () => {
    expect(escapeRegex('A.B')).toBe('A\\.B');
  });

  test('escapes plus character', () => {
    expect(escapeRegex('A+B')).toBe('A\\+B');
  });

  test('escapes parentheses', () => {
    expect(escapeRegex('(Corp)')).toBe('\\(Corp\\)');
  });

  test('escapes square brackets', () => {
    expect(escapeRegex('A[1]')).toBe('A\\[1\\]');
  });

  test('escapes backslash', () => {
    expect(escapeRegex('A\\B')).toBe('A\\\\B');
  });

  test('does not escape normal alphanumeric characters', () => {
    expect(escapeRegex('CompanyABC123')).toBe('CompanyABC123');
  });

  test('escaped string is safe to use in new RegExp', () => {
    const dangerous = '(a+)+$';
    const escaped = escapeRegex(dangerous);
    // Should not throw
    expect(() => new RegExp(escaped)).not.toThrow();
  });

  test('escaped string matches the literal company name', () => {
    const name = 'Corp.A+B (Ltd)';
    const escaped = escapeRegex(name);
    const regex = new RegExp(`^${escaped}$`, 'i');
    expect(regex.test('Corp.A+B (Ltd)')).toBe(true);
    expect(regex.test('CorpXAYB ZLtd')).toBe(false);
  });
});

// ── Auth middleware protection ────────────────────────────────────────────────

describe('protectRoute middleware', () => {
  const mockNext = jest.fn();

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  jest.unstable_mockModule('jsonwebtoken', () => ({
    default: { verify: jest.fn() },
  }));

  jest.unstable_mockModule('../model/auth.model.js', () => ({
    User: { findById: jest.fn() },
  }));

  test('returns 401 when no token in cookies', async () => {
    const { protectRoute } = await import('../middleware/auth.middleware.js');
    const req = { cookies: {} };
    const res = mockRes();
    await protectRoute(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('returns 401 for invalid token', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });
    const { protectRoute } = await import('../middleware/auth.middleware.js');
    const req = { cookies: { token: 'bad' } };
    const res = mockRes();
    await protectRoute(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// ── Role enforcement in signup ────────────────────────────────────────────────

describe('signup role enforcement', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  jest.unstable_mockModule('../model/auth.model.js', () => ({
    User: {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({
        _doc: { _id: '1', username: 'u', email: 'e@e.com', role: 'viewer' },
      }),
    },
  }));
  jest.unstable_mockModule('../model/event.model.js', () => ({
    Events: { findById: jest.fn() },
  }));
  jest.unstable_mockModule('../utils/generateToken.js', () => ({
    generateTokenAndCookie: jest.fn(),
  }));
  jest.unstable_mockModule('bcrypt', () => ({
    default: { hash: jest.fn().mockResolvedValue('hashed'), compare: jest.fn() },
  }));
  jest.unstable_mockModule('mongoose', () => ({
    default: { Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } } },
  }));

  test('viewer cannot self-assign admin role', async () => {
    const { signup } = await import('../controller/auth.controller.js');
    const req = {
      body: { username: 'u', email: 'e@e.com', password: 'pass', role: 'admin' },
      user: { role: 'viewer' },
    };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('unauthenticated user cannot create admin account', async () => {
    const { signup } = await import('../controller/auth.controller.js');
    const req = {
      body: { username: 'u', email: 'e@e.com', password: 'pass', role: 'admin' },
      user: undefined,
    };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('manager cannot self-assign admin role', async () => {
    const { signup } = await import('../controller/auth.controller.js');
    const req = {
      body: { username: 'u', email: 'e@e.com', password: 'pass', role: 'admin' },
      user: { role: 'manager' },
    };
    const res = mockRes();
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── API key validation ────────────────────────────────────────────────────────

describe('API key validation - updateUserStatusByEmail', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, X_API_KEY: 'secret-key' };
  });

  afterAll(() => { process.env = OLD_ENV; });

  jest.unstable_mockModule('../model/filedata.model.js', () => ({
    UserCollection: {
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      deleteMany: jest.fn(),
      updateOne: jest.fn(),
    },
  }));

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('rejects request with no API key', async () => {
    const { updateUserStatusByEmail } = await import('../controller/file.controller.js');
    const req = { body: { email: 'a@a.com', status: 'completed' }, headers: {} };
    const res = mockRes();
    await updateUserStatusByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('rejects request with wrong API key', async () => {
    const { updateUserStatusByEmail } = await import('../controller/file.controller.js');
    const req = {
      body: { email: 'a@a.com', status: 'completed' },
      headers: { 'x-api-key': 'wrong' },
    };
    const res = mockRes();
    await updateUserStatusByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('accepts request with correct API key', async () => {
    const { updateUserStatusByEmail } = await import('../controller/file.controller.js');
    const { UserCollection } = await import('../model/filedata.model.js');
    UserCollection.findOneAndUpdate.mockResolvedValue({
      email: 'a@a.com', status: 'completed', firstName: 'J', lastName: 'D',
    });
    const req = {
      body: { email: 'a@a.com', status: 'completed' },
      headers: { 'x-api-key': 'secret-key' },
    };
    const res = mockRes();
    await updateUserStatusByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
