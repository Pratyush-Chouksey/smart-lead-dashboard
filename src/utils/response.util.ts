import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

/**
 * Send a standardised success response.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  pagination?: PaginationMeta
): Response => {
  const payload: ApiResponse<T> = { success: true, message, data };
  if (pagination) payload.pagination = pagination;
  return res.status(statusCode).json(payload);
};

/**
 * Send a standardised error response.
 */
export const sendError = (
  res: Response,
  message = 'Something went wrong',
  statusCode = 500,
  errors?: string[]
): Response => {
  const payload: ApiResponse = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Parse pagination query params with safe defaults.
 */
export const parsePagination = (
  page?: string,
  limit?: string
): { page: number; limit: number; skip: number } => {
  const p = Math.max(1, parseInt(page || '1', 10));
  const l = Math.min(100, Math.max(1, parseInt(limit || '10', 10)));
  return { page: p, limit: l, skip: (p - 1) * l };
};

/**
 * Build a PaginationMeta object.
 */
export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
