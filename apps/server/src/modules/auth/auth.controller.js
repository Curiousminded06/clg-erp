import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/AppError.js';
import {
  comparePassword,
  hashPassword,
  sanitizeUser,
  signAccessToken
} from './auth.service.js';

const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000
};

function sendAuthResponse(res, user) {
  const token = signAccessToken(user);

  res.cookie('access_token', token, authCookieOptions);

  return res.status(200).json({
    success: true,
    token,
    user: sanitizeUser(user)
  });
}

export async function register(req, res, next) {
  try {
    const { fullName, email, password, role } = req.validated.body;
    const existing = await User.findOne({ email: email.toLowerCase() }).lean();

    if (existing) {
      throw new AppError('Email already exists', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ fullName, email, passwordHash, role });

    return sendAuthResponse(res, user);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, role } = req.validated.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.role !== role) {
      throw new AppError('Invalid credentials', 401);
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.sub).lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
}

export function logout(_req, res) {
  res.clearCookie('access_token', authCookieOptions);
  return res.status(200).json({ success: true, message: 'Logged out' });
}
