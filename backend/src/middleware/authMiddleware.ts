import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import type { AuthenticatedRequest, IUserDocument } from '../types'
import type { TokenPayload } from '../utils/generateToken'

// ─── Protect: verify JWT and attach user to request ──────────────────────────

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorised, no token provided' })
    return
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    res.status(500).json({ success: false, message: 'Server configuration error' })
    return
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload

    const user = await User.findById(decoded.id).select('+password')
    if (!user) {
      res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' })
      return
    }

    // Attach the full user document so controllers can access role, _id, etc.
    ;(req as AuthenticatedRequest).user = user as unknown as IUserDocument
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Not authorised, token invalid or expired' })
  }
}

// ─── Admin only: must run after protect ──────────────────────────────────────

export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthenticatedRequest

  if (authReq.user?.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Forbidden: admin access required' })
    return
  }

  next()
}
