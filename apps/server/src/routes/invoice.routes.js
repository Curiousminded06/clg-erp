import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  listInvoices,
  updateInvoice
} from '../modules/invoice/invoice.controller.js';
import {
  createInvoiceSchema,
  invoiceIdSchema,
  listInvoiceSchema,
  updateInvoiceSchema
} from '../modules/invoice/invoice.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles('admin', 'faculty'), validate(listInvoiceSchema), listInvoices);
router.get('/:id', requireRoles('admin', 'faculty'), validate(invoiceIdSchema), getInvoiceById);
router.post('/', requireRoles('admin'), validate(createInvoiceSchema), createInvoice);
router.patch('/:id', requireRoles('admin'), validate(updateInvoiceSchema), updateInvoice);
router.delete('/:id', requireRoles('admin'), validate(invoiceIdSchema), deleteInvoice);

export default router;
