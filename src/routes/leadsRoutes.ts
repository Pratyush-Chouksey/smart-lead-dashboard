import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  exportLeads,
} from '../controllers/leadsController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { LEAD_STATUSES, LEAD_SOURCES } from '../models/Lead';

const router = Router();

// ─── Reusable validation chains ───────────────────────────────────────────────

const createValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 150 }).withMessage('Name cannot exceed 150 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('source')
    .trim()
    .notEmpty().withMessage('Source is required')
    .isIn(LEAD_SOURCES)
    .withMessage(`Source must be one of: ${LEAD_SOURCES.join(', ')}`),

  body('status')
    .optional()
    .isIn(LEAD_STATUSES)
    .withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),
];

const updateValidation = [
  param('id')
    .isMongoId().withMessage('Invalid lead ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 150 }).withMessage('Name cannot exceed 150 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('status')
    .optional()
    .isIn(LEAD_STATUSES)
    .withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),

  body('source')
    .optional()
    .isIn(LEAD_SOURCES)
    .withMessage(`Source must be one of: ${LEAD_SOURCES.join(', ')}`),

  body()
    .custom((_, { req }) => {
      const allowed = ['name', 'email', 'status', 'source'];
      const received = Object.keys(req.body);
      const invalid = received.filter((k) => !allowed.includes(k));
      if (invalid.length > 0) {
        throw new Error(`Unknown field(s): ${invalid.join(', ')}`);
      }
      return true;
    }),
];

const getLeadsValidation = [
  query('status')
    .optional()
    .isIn(LEAD_STATUSES)
    .withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),

  query('source')
    .optional()
    .isIn(LEAD_SOURCES)
    .withMessage(`Source must be one of: ${LEAD_SOURCES.join(', ')}`),

  query('sort')
    .optional()
    .isIn(['latest', 'oldest'])
    .withMessage("Sort must be 'latest' or 'oldest'"),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search term cannot exceed 100 characters'),
];

const mongoIdParam = [
  param('id').isMongoId().withMessage('Invalid lead ID'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/leads — create a lead (admin | sales)
router.post(
  '/',
  authenticate,
  authorize('admin', 'sales'),
  createValidation,
  createLead
);

// GET /api/leads — list leads with filters + pagination (admin | sales)
router.get(
  '/',
  authenticate,
  authorize('admin', 'sales'),
  getLeadsValidation,
  getLeads
);

// GET /api/leads/export — download CSV (admin | sales)
// ⚠️  Must be registered BEFORE /:id to avoid Express treating 'export' as a Mongo ID
const exportValidation = [
  query('status')
    .optional()
    .isIn(LEAD_STATUSES)
    .withMessage(`Status must be one of: ${LEAD_STATUSES.join(', ')}`),
  query('source')
    .optional()
    .isIn(LEAD_SOURCES)
    .withMessage(`Source must be one of: ${LEAD_SOURCES.join(', ')}`),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search term cannot exceed 100 characters'),
];

router.get(
  '/export',
  authenticate,
  authorize('admin', 'sales'),
  exportValidation,
  exportLeads
);

// GET /api/leads/:id — fetch single lead (admin | sales)
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'sales'),
  mongoIdParam,
  getLeadById
);

// PUT /api/leads/:id — update lead (admin | sales)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'sales'),
  updateValidation,
  updateLead
);

// DELETE /api/leads/:id — delete lead (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  mongoIdParam,
  deleteLead
);

export default router;
