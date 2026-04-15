import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createAttendance,
  deleteAttendance,
  getAttendanceById,
  listAttendance,
  updateAttendance
} from '../modules/attendance/attendance.controller.js';
import {
  attendanceIdSchema,
  createAttendanceSchema,
  listAttendanceSchema,
  updateAttendanceSchema
} from '../modules/attendance/attendance.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listAttendanceSchema), listAttendance);
router.get('/:id', validate(attendanceIdSchema), getAttendanceById);
router.post('/', requireRoles('admin', 'faculty'), validate(createAttendanceSchema), createAttendance);
router.patch('/:id', requireRoles('admin', 'faculty'), validate(updateAttendanceSchema), updateAttendance);
router.delete('/:id', requireRoles('admin'), validate(attendanceIdSchema), deleteAttendance);

export default router;
