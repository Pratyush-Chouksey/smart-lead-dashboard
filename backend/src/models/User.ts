import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs'
import type { IUser } from '../types'

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // exclude by default from queries
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'sales'],
        message: 'Role must be either admin or sales',
      },
      default: 'sales',
    },
  },
  {
    timestamps: true,
  }
)

// ─── Pre-save Hook: Hash password ─────────────────────────────────────────────

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// ─── Instance Method: Compare password ────────────────────────────────────────

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string)
}

const User = model<IUser>('User', userSchema)

export default User
