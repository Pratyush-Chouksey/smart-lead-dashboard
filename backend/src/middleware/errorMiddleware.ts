import { Request, Response, NextFunction } from 'express'
import { Error as MongooseError } from 'mongoose'

// ─── Typed application error ──────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// ─── 404 catch-all ────────────────────────────────────────────────────────────

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}

// ─── Global error handler ─────────────────────────────────────────────────────

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode = 500
  let message = 'Internal Server Error'

  // AppError (operational)
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  // Mongoose validation error
  else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400
    const messages = Object.values(err.errors).map((e) => e.message)
    message = messages.join(', ')
  }

  // Mongoose cast error (e.g. bad ObjectId)
  else if (err instanceof MongooseError.CastError) {
    statusCode = 400
    message = `Invalid value for field: ${err.path}`
  }

  // MongoDB duplicate key
  else if ((err as NodeJS.ErrnoException).code === '11000') {
    statusCode = 409
    const field = Object.keys((err as unknown as Record<string, Record<string, unknown>>).keyValue ?? {})[0] ?? 'field'
    message = `Duplicate value: a record with that ${field} already exists`
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Log unexpected errors in development
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('Unhandled error:', err)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && statusCode === 500
      ? { stack: err.stack }
      : {}),
  })
}
