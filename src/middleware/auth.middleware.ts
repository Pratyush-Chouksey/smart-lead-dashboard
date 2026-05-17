// This file is superseded by authMiddleware.ts which contains the canonical
// JWT verification logic, JwtPayload interface, and Express.Request augmentation.
//
// Re-export everything from the authoritative module so any stale imports
// continue to work without creating duplicate type declarations.
export { authenticate, authorize, type JwtPayload } from './authMiddleware';
