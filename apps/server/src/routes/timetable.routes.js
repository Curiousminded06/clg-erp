import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createTimetable,
  deleteTimetable,
  getTimetableById,
  getMyTimetable,
  listTimetable,
  updateTimetable
} from '../modules/timetable/timetable.controller.js';
import {
  createTimetableSchema,
  listTimetableSchema,
  timetableIdSchema,
  updateTimetableSchema
} from '../modules/timetable/timetable.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles('admin', 'faculty'), validate(listTimetableSchema), listTimetable);
router.get('/me', requireRoles('student'), getMyTimetable);
router.get('/:id', requireRoles('admin', 'faculty'), validate(timetableIdSchema), getTimetableById);
router.post('/', requireRoles('admin', 'faculty'), validate(createTimetableSchema), createTimetable);
router.patch('/:id', requireRoles('admin', 'faculty'), validate(updateTimetableSchema), updateTimetable);
router.delete('/:id', requireRoles('admin'), validate(timetableIdSchema), deleteTimetable);

export default router;
