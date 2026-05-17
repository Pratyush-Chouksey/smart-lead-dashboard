import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
}

/**
 * Centralised error-handling middleware.
 * Must be registered last in Express (after all routes).
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Internal server error';

  console.error(`[${new Date().toISOString()}] ❌ ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * Factory to create a typed application error with a status code.
 */
export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpError';
    Error.captureStackTrace(this, this.constructor);
  }
}
