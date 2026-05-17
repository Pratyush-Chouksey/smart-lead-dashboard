import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { FilterQuery } from 'mongoose';
import { stringify } from 'csv-stringify';
import { Lead, ILead, LeadStatus, LeadSource } from '../models/Lead';

// ─── Shared helper ────────────────────────────────────────────────────────────

const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      data: errors.array().map((e) => ({
        field: e.type === 'field' ? (e as { path: string }).path : 'unknown',
        message: e.msg,
      })),
    });
    return true;
  }
  return false;
};

// ─── Shared filter builder ────────────────────────────────────────────────────

interface LeadFilterParams {
  status?:  string;
  source?:  string;
  search?:  string;
  userId:   string;
  role:     'admin' | 'sales';
}

const buildLeadFilter = ({ status, source, search, userId, role }: LeadFilterParams): FilterQuery<ILead> => {
  const filter: FilterQuery<ILead> = {};

  // Role-based scoping — sales only sees their own leads
  if (role === 'sales') filter.createdBy = userId;

  if (status) filter.status = status as LeadStatus;
  if (source) filter.source = source as LeadSource;

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    // Cast to FilterQuery<ILead>[] — Mongoose accepts RegExp for string fields
    // but the generic type needs an explicit assertion here.
    filter.$or = [
      { name: regex } as unknown as FilterQuery<ILead>,
      { email: regex } as unknown as FilterQuery<ILead>,
    ];
  }

  return filter;
};


/**
 * POST /api/leads
 * Auth: admin | sales
 * Body: { name, email, source, status? }
 */
export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { name, email, source, status } = req.body as {
      name: string;
      email: string;
      source: LeadSource;
      status?: LeadStatus;
    };

    // Duplicate email guard (provides a cleaner message than Mongo's E11000)
    const exists = await Lead.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      res.status(409).json({
        success: false,
        message: 'A lead with this email already exists',
      });
      return;
    }

    const lead = await Lead.create({
      name,
      email,
      source,
      ...(status && { status }),
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead,
    });
  } catch (error) {
    console.error('[createLead]', error);
    res.status(500).json({ success: false, message: 'Failed to create lead' });
  }
};

// ─── 2. getLeads ─────────────────────────────────────────────────────────────

/**
 * GET /api/leads
 * Auth: admin (all leads) | sales (own leads only)
 *
 * Query params:
 *   status   — filter by LeadStatus
 *   source   — filter by LeadSource
 *   search   — case-insensitive regex on name OR email
 *   sort     — 'latest' (default) | 'oldest'
 *   page     — default 1
 *   limit    — default 10, max 100
 */
export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      source,
      search,
      sort = 'latest',
      page = '1',
      limit = '10',
    } = req.query as {
      status?: string;
      source?: string;
      search?: string;
      sort?: string;
      page?: string;
      limit?: string;
    };

    // ── Pagination ─────────────────────────────────────────────────────────
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit   = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip        = (currentPage - 1) * pageLimit;

    // ── Build filter via shared helper (AND logic) ────────────────────────
    const filter = buildLeadFilter({
      status, source, search,
      userId: req.user!.id,
      role:   req.user!.role,
    });

    // ── Sort ───────────────────────────────────────────────────────────────
    const sortOrder = sort === 'oldest' ? 1 : -1;

    // ── Execute (parallel count + data fetch) ──────────────────────────────
    const [totalCount, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalCount / pageLimit);

    res.status(200).json({
      success: true,
      message: 'Leads fetched successfully',
      data: {
        leads,
        totalCount,
        totalPages,
        currentPage,
      },
    });
  } catch (error) {
    console.error('[getLeads]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
};

// ─── 3. getLeadById ───────────────────────────────────────────────────────────

/**
 * GET /api/leads/:id
 * Auth: admin (any lead) | sales (own lead only)
 */
export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('createdBy', 'name email role');

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    // Sales users may only view their own leads
    if (
      req.user!.role === 'sales' &&
      lead.createdBy.toString() !== req.user!.id
    ) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view this lead',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Lead fetched successfully',
      data: lead,
    });
  } catch (error) {
    console.error('[getLeadById]', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lead' });
  }
};

// ─── 4. updateLead ───────────────────────────────────────────────────────────

/**
 * PUT /api/leads/:id
 * Auth: admin (any lead) | sales (own lead only)
 * Body: any subset of { name, email, status, source }
 */
export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    // Sales users may only update their own leads
    if (
      req.user!.role === 'sales' &&
      lead.createdBy.toString() !== req.user!.id
    ) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to update this lead',
      });
      return;
    }

    // Whitelist updatable fields — prevent createdBy / _id tampering
    const { name, email, status, source } = req.body as Partial<{
      name: string;
      email: string;
      status: LeadStatus;
      source: LeadSource;
    }>;

    const updates: Partial<ILead> = {};
    if (name   !== undefined) updates.name   = name;
    if (email  !== undefined) updates.email  = email;
    if (status !== undefined) updates.status = status;
    if (source !== undefined) updates.source = source;

    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('[updateLead]', error);
    res.status(500).json({ success: false, message: 'Failed to update lead' });
  }
};

// ─── 5. deleteLead ───────────────────────────────────────────────────────────

/**
 * DELETE /api/leads/:id
 * Auth: admin only
 */
export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    await lead.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    console.error('[deleteLead]', error);
    res.status(500).json({ success: false, message: 'Failed to delete lead' });
  }
};

// ─── 6. exportLeads ─────────────────────────────────────────────────────────

/**
 * GET /api/leads/export
 * Auth: admin (all matching leads) | sales (own matching leads only)
 *
 * Query params: status, source, search (same semantics as getLeads, no pagination)
 * Response: CSV file download
 */
export const exportLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, source, search } = req.query as {
      status?: string;
      source?: string;
      search?: string;
    };

    // ── Build filter (shared helper — identical logic to getLeads) ──────────
    const filter = buildLeadFilter({
      status, source, search,
      userId: req.user!.id,
      role:   req.user!.role,
    });

    // ── Fetch all matching leads (no pagination for export) ───────────────
    const leads = await Lead.find(filter)
      .populate<{ createdBy: { name: string; email: string } }>('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // ── Shape rows for CSV ──────────────────────────────────────────
    type CsvRow = {
      Name: string;
      Email: string;
      Status: string;
      Source: string;
      'Created By': string;
      'Created At': string;
    };

    const rows: CsvRow[] = leads.map((lead) => ({
      Name:         lead.name,
      Email:        lead.email,
      Status:       lead.status,
      Source:       lead.source,
      'Created By': typeof lead.createdBy === 'object' && lead.createdBy !== null
        ? `${(lead.createdBy as { name: string; email: string }).name} <${(lead.createdBy as { name: string; email: string }).email}>`
        : String(lead.createdBy),
      'Created At': new Date(lead.createdAt).toISOString(),
    }));

    // ── Stringify to CSV ────────────────────────────────────────────
    // Guard: if no leads match, emit just the header row so the file is valid
    const csvColumns: (keyof CsvRow)[] = ['Name', 'Email', 'Status', 'Source', 'Created By', 'Created At'];

    const csvBuffer = await new Promise<string>((resolve, reject) => {
      stringify(
        rows,
        {
          header:  true,
          columns: csvColumns as string[],
          cast: {
            // Ensure all values are properly quoted strings (prevents CSV injection)
            string: (value) => ({ value, quote: true }),
          },
        },
        (err, output) => {
          if (err) reject(err);
          else     resolve(output ?? '');
        }
      );
    });

    // ── Send as downloadable CSV file ──────────────────────────────
    const filename = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    const buffer   = Buffer.from(csvBuffer, 'utf8');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.byteLength);
    res.status(200).end(buffer);
  } catch (error) {
    console.error('[exportLeads]', error);
    res.status(500).json({ success: false, message: 'Failed to export leads' });
  }
};
