import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createCampusUpdate,
  deleteCampusUpdate,
  listCampusUpdates,
  updateCampusUpdate
} from '../modules/campus/campus.controller.js';
import {
  campusUpdateIdSchema,
  createCampusUpdateSchema,
  listCampusUpdateSchema,
  updateCampusUpdateSchema
} from '../modules/campus/campus.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listCampusUpdateSchema), listCampusUpdates);
router.post('/', requireRoles('admin'), validate(createCampusUpdateSchema), createCampusUpdate);
router.patch('/:id', requireRoles('admin'), validate(updateCampusUpdateSchema), updateCampusUpdate);
router.delete('/:id', requireRoles('admin'), validate(campusUpdateIdSchema), deleteCampusUpdate);

export default router;
