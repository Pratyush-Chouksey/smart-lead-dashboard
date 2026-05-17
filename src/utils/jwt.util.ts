import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

/**
 * Generate a signed JWT token for the given payload.
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

/**
 * Verify and decode a JWT token.
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};
