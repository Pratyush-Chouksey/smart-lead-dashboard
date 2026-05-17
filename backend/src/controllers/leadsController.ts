import { Request, Response, NextFunction } from 'express'
import { FilterQuery, Types } from 'mongoose'
import Lead from '../models/Lead'
import { AppError } from '../middleware/errorMiddleware'
import type {
  AuthenticatedRequest,
  ILead,
  CreateLeadPayload,
  UpdateLeadPayload,
  LeadQueryParams,
  ExportQueryParams,
  ApiResponse,
  PaginatedResponse,
  LeadStatus,
  LeadSource,
} from '../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a Mongoose filter based on role, status, source and search term */
function buildFilter(
  user: AuthenticatedRequest['user'],
  query: LeadQueryParams | ExportQueryParams
): FilterQuery<ILead> {
  const filter: FilterQuery<ILead> = {}

  // Sales users can only see their own leads
  if (user.role === 'sales') {
    filter.createdBy = user._id
  }

  if (query.status) filter.status = query.status
  if (query.source) filter.source = query.source

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { company: { $regex: query.search, $options: 'i' } },
    ]
  }

  return filter
}

// ─── GET /api/leads ───────────────────────────────────────────────────────────

export const getLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest
    const query = req.query as LeadQueryParams

    const page = Math.max(1, parseInt(query.page ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '10', 10)))
    const skip = (page - 1) * limit

    const allowedSortFields: Array<keyof ILead> = ['name', 'email', 'status', 'source', 'createdAt', 'updatedAt']
    const sortBy = allowedSortFields.includes(query.sortBy as keyof ILead)
      ? (query.sortBy as string)
      : 'createdAt'
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1

    const filter = buildFilter(authReq.user, query)

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('createdBy', 'name email role')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(filter),
    ])

    const response: ApiResponse<PaginatedResponse<ILead>> = {
      success: true,
      message: 'Leads retrieved successfully',
      data: {
        leads: leads as unknown as ILead[],
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    }

    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/leads ──────────────────────────────────────────────────────────

export const createLead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest
    const body = req.body as CreateLeadPayload

    if (!body.name || !body.email || !body.source) {
      throw new AppError('name, email and source are required', 400)
    }

    const lead = await Lead.create({
      ...body,
      createdBy: authReq.user._id,
    })

    await lead.populate('createdBy', 'name email role')

    const response: ApiResponse<ILead> = {
      success: true,
      message: 'Lead created successfully',
      data: lead.toObject() as unknown as ILead,
    }

    res.status(201).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── GET /api/leads/export ────────────────────────────────────────────────────

export const exportLeads = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest
    const query = req.query as ExportQueryParams

    const filter = buildFilter(authReq.user, query)

    const leads = await Lead.find(filter)
      .populate('createdBy', 'name')   // name only — email no longer needed
      .sort({ createdAt: -1 })
      .lean()

    // ── Date formatter: DD/MM/YYYY ─────────────────────────────────────────
    const formatDate = (date: Date): string => {
      const d   = new Date(date)
      const day   = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year  = d.getFullYear()
      return `${day}/${month}/${year}`
    }

    // ── CSV cell escaper ───────────────────────────────────────────────────
    const escape = (value: unknown): string => {
      const str = value == null ? '' : String(value)
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // ── Headers (exact order as specified) ────────────────────────────────
    const header = ['Name', 'Email', 'Status', 'Source', 'Created By', 'Created At', 'Updated At']

    // ── Rows ──────────────────────────────────────────────────────────────
    const rows = leads.map((lead) => {
      const createdBy = lead.createdBy as unknown as { name: string } | null
      return [
        lead.name,
        lead.email,
        lead.status,
        lead.source,
        createdBy?.name ?? '',               // name only — no <email> suffix
        formatDate(lead.createdAt as Date),
        formatDate(lead.updatedAt as Date),
      ]
        .map(escape)
        .join(',')
    })

    const csv = [header.map(escape).join(','), ...rows].join('\n')

    // ── Filename: Leads_DD-MM-YYYY.csv ────────────────────────────────────
    const today = new Date()
    const dd    = String(today.getDate()).padStart(2, '0')
    const mm    = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy  = today.getFullYear()
    const filename = `Leads_${dd}-${mm}-${yyyy}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(csv)
  } catch (err) {
    next(err)
  }
}


// ─── GET /api/leads/:id ───────────────────────────────────────────────────────

export const getLeadById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest

    if (!Types.ObjectId.isValid(req.params.id)) {
      throw new AppError('Invalid lead ID', 400)
    }

    const lead = await Lead.findById(req.params.id).populate('createdBy', 'name email role')

    if (!lead) {
      throw new AppError('Lead not found', 404)
    }

    // Sales users can only view their own leads
    if (
      authReq.user.role === 'sales' &&
      lead.createdBy.toString() !== authReq.user._id.toString()
    ) {
      throw new AppError('Not authorised to view this lead', 403)
    }

    const response: ApiResponse<ILead> = {
      success: true,
      message: 'Lead retrieved',
      data: lead.toObject() as unknown as ILead,
    }

    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── PUT /api/leads/:id ───────────────────────────────────────────────────────

export const updateLead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest

    if (!Types.ObjectId.isValid(req.params.id)) {
      throw new AppError('Invalid lead ID', 400)
    }

    const lead = await Lead.findById(req.params.id)

    if (!lead) {
      throw new AppError('Lead not found', 404)
    }

    // Sales users can only edit their own leads
    if (
      authReq.user.role === 'sales' &&
      lead.createdBy.toString() !== authReq.user._id.toString()
    ) {
      throw new AppError('Not authorised to update this lead', 403)
    }

    const body = req.body as UpdateLeadPayload

    // Validate enum values if provided
    const validStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Lost']
    const validSources: LeadSource[] = ['Website', 'Instagram', 'Referral']

    if (body.status && !validStatuses.includes(body.status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400)
    }
    if (body.source && !validSources.includes(body.source)) {
      throw new AppError(`Invalid source. Must be one of: ${validSources.join(', ')}`, 400)
    }

    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role')

    const response: ApiResponse<ILead> = {
      success: true,
      message: 'Lead updated successfully',
      data: (updated as unknown) as ILead,
    }

    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /api/leads/:id — admin only ──────────────────────────────────────

export const deleteLead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      throw new AppError('Invalid lead ID', 400)
    }

    const lead = await Lead.findById(req.params.id)

    if (!lead) {
      throw new AppError('Lead not found', 404)
    }

    await lead.deleteOne()

    const response: ApiResponse<{ id: string }> = {
      success: true,
      message: 'Lead deleted successfully',
      data: { id: req.params.id },
    }

    res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}
