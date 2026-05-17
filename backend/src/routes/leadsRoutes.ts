import { Router } from 'express'
import {
  getLeads,
  createLead,
  exportLeads,
  getLeadById,
  updateLead,
  deleteLead,
} from '../controllers/leadsController'
import { protect, adminOnly } from '../middleware/authMiddleware'

const router = Router()

// All leads routes require authentication
router.use(protect)

// List & Create
router.route('/').get(getLeads).post(createLead)

// CSV Export — must come before /:id to avoid route conflict
router.get('/export', exportLeads)

// Single lead CRUD
router.route('/:id').get(getLeadById).put(updateLead)

// Delete — admin only
router.delete('/:id', adminOnly, deleteLead)

export default router
