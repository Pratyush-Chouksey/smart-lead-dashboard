import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { sendSuccess, sendError } from '../utils/response.util';

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      sendError(res, 'Email already in use', 409);
      return;
    }

    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed });

    const token = generateToken({ id: user._id.toString(), email: user.email, role: user.role as 'admin' | 'sales' });

    sendSuccess(
      res,
      { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      'Account created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // select: false on password field — explicitly include it here
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const token = generateToken({ id: user._id.toString(), email: user.email, role: user.role as 'admin' | 'sales' });

    sendSuccess(
      res,
      { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};

// ─── Get current user (protected) ─────────────────────────────────────────────
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, user, 'User fetched successfully');
  } catch (err) {
    next(err);
  }
};
