import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, IUser } from '../models/User';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Collect express-validator errors and send a 422 if any exist.
 * Returns true when there are errors (caller should return early).
 */
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      data: errors.array().map((e) => ({ field: e.type === 'field' ? (e as { path: string }).path : 'unknown', message: e.msg })),
    });
    return true;
  }
  return false;
};

/**
 * Sign a JWT containing { id, email, role }.
 */
const signToken = (user: IUser): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined in environment variables');

  const payload = {
    id: String(user._id),
    email: user.email,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
};

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 *
 * Body: { name, email, password }
 * Returns: { success, message, data: { token, user } }
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate inputs
    if (handleValidationErrors(req, res)) return;

    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    // 2. Duplicate email check
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
      return;
    }

    // 3. Create user — password hashed automatically via pre-save hook
    const user = await User.create({ name, email, password });

    // 4. Sign token
    const token = signToken(user);

    // 5. Respond (never include password)
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[register]', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * Returns: { success, message, data: { token, user } }
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate inputs
    if (handleValidationErrors(req, res)) return;

    const { email, password } = req.body as { email: string; password: string };

    // 2. Find user — explicitly select password (excluded by default via select:false)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // 3. Use a generic error message to avoid user enumeration
    const invalidCredentialsResponse = (): void => {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    };

    if (!user) {
      invalidCredentialsResponse();
      return;
    }

    // 4. Compare password via instance method defined on the schema
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      invalidCredentialsResponse();
      return;
    }

    // 5. Sign token
    const token = signToken(user);

    // 6. Respond — strip password from the returned user object
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    });
  }
};
