import { Schema, model, Document, Types } from 'mongoose';

// ─── Constants (single source of truth for enums) ─────────────────────────────

export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Lost'] as const;
export const LEAD_SOURCES  = ['Website', 'Instagram', 'Referral'] as const;

export type LeadStatus = typeof LEAD_STATUSES[number];
export type LeadSource = typeof LEAD_SOURCES[number];

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ILead extends Document {
  name:      string;
  email:     string;
  status:    LeadStatus;
  source:    LeadSource;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const leadSchema = new Schema<ILead>(
  {
    name: {
      type:     String,
      required: [true, 'Lead name is required'],
      trim:     true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },

    email: {
      type:     String,
      required: [true, 'Lead email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    status: {
      type:    String,
      enum:    {
        values:  LEAD_STATUSES,
        message: `Status must be one of: ${LEAD_STATUSES.join(', ')}`,
      },
      default: 'New',
    },

    source: {
      type:     String,
      required: [true, 'Lead source is required'],
      enum:     {
        values:  LEAD_SOURCES,
        message: `Source must be one of: ${LEAD_SOURCES.join(', ')}`,
      },
    },

    createdBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'createdBy (User reference) is required'],
    },
  },
  {
    timestamps: true,   // auto-manages createdAt & updatedAt
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Efficient filtering by status and source (common dashboard queries)
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
// Efficient lookup of all leads created by a specific user
leadSchema.index({ createdBy: 1, createdAt: -1 });

// ─── Model & Exports ──────────────────────────────────────────────────────────

export const Lead = model<ILead>('Lead', leadSchema);
