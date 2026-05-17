import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'sales';
  createdAt: Date;

  /** Compare a plain-text candidate against the stored hash */
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─── Static methods (optional extension point) ────────────────────────────────

interface IUserModel extends Model<IUser> {}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser, IUserModel>(
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
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Excluded from query results by default
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
    timestamps: { createdAt: true, updatedAt: false }, // only createdAt as per spec
    versionKey: false,
  }
);

// ─── Pre-save Hook — Hash password ───────────────────────────────────────────

userSchema.pre<IUser>('save', async function (next) {
  // Only hash when the password field has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// ─── Instance Method — Compare password ──────────────────────────────────────

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  // `this.password` may not be selected by default; guard against undefined
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Model & Exports ──────────────────────────────────────────────────────────

export const User = model<IUser, IUserModel>('User', userSchema);
