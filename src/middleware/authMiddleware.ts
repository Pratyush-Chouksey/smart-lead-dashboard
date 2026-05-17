import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  email: string;
  role: 'admin' | 'sales';
  iat?: number;
  exp?: number;
}

// Extend Express Request so TypeScript knows about req.user everywhere
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── authenticate ─────────────────────────────────────────────────────────────

/**
 * Verifies the JWT from the Authorization header (Bearer <token>).
 * On success, attaches the decoded payload to req.user and calls next().
 * On failure, responds with 401 without calling next().
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  // Expect exactly "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({
      success: false,
      message: 'Server configuration error: JWT_SECRET is missing.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token has expired. Please log in again.' });
      return;
    }
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// ─── authorize ────────────────────────────────────────────────────────────────

/**
 * Role-based access guard. Must be used AFTER authenticate.
 *
 * Usage:
 *   router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
 *   router.get('/leads',        authenticate, authorize('admin', 'sales'), getLeads);
 */
export const authorize = (...roles: Array<'admin' | 'sales'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // Should never happen if authenticate ran first, but guard anyway
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access forbidden. Required role: ${roles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
};
