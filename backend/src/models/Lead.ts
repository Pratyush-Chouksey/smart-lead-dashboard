import { Schema, model, Types } from 'mongoose'
import type { ILead } from '../types'

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: undefined,
    },
    company: {
      type: String,
      trim: true,
      default: undefined,
    },
    status: {
      type: String,
      enum: {
        values: ['New', 'Contacted', 'Qualified', 'Lost'],
        message: 'Status must be one of: New, Contacted, Qualified, Lost',
      },
      default: 'New',
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      enum: {
        values: ['Website', 'Instagram', 'Referral'],
        message: 'Source must be one of: Website, Instagram, Referral',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: undefined,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
  },
  {
    timestamps: true,
  }
)

// ─── Indexes ──────────────────────────────────────────────────────────────────

leadSchema.index({ createdBy: 1 })
leadSchema.index({ status: 1 })
leadSchema.index({ source: 1 })
leadSchema.index({ name: 'text', email: 'text', company: 'text' })

const Lead = model<ILead>('Lead', leadSchema)

export default Lead
