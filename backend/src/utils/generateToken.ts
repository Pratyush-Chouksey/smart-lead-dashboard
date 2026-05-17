import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'

export interface TokenPayload {
  id: string
}

const generateToken = (userId: Types.ObjectId): string => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables')
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn']

  return jwt.sign({ id: userId.toString() } satisfies TokenPayload, secret, { expiresIn })
}

export default generateToken
