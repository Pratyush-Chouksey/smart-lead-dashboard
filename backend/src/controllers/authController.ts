import { Request, Response, NextFunction } from 'express'
import User from '../models/User'
import generateToken from '../utils/generateToken'
import { AppError } from '../middleware/errorMiddleware'
import type {
  RegisterPayload,
  LoginPayload,
  AuthResponse,
  ApiResponse,
} from '../types'

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body as RegisterPayload

    if (!name || !email || !password) {
      throw new AppError('Please provide name, email and password', 400)
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      throw new AppError('A user with that email already exists', 409)
    }

    const user = await User.create({ name, email, password, role })

    const token = generateToken(user._id)

    const response: ApiResponse<AuthResponse> = {
      success: true,
      message: 'Registration successful',
      data: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    }

    res.status(201).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as LoginPayload

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400)
    }

    // Explicitly select password (it has select: false on the schema)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401)
    }

    const token = generateToken(user._id)

    const response: ApiResponse<AuthResponse> = {
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    }

    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // req.user is populated by protect middleware
    const user = (req as import('../types').AuthenticatedRequest).user

    const response: ApiResponse<Omit<AuthResponse, 'token'>> = {
      success: true,
      message: 'User retrieved',
      data: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }

    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}
