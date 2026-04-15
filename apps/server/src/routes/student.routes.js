import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent
} from '../modules/student/student.controller.js';
import {
  createStudentSchema,
  listStudentSchema,
  studentIdParamSchema,
  updateStudentSchema
} from '../modules/student/student.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles('admin', 'faculty'), validate(listStudentSchema), listStudents);
router.get('/:id', validate(studentIdParamSchema), getStudentById);
router.post('/', requireRoles('admin', 'faculty'), validate(createStudentSchema), createStudent);
router.patch('/:id', requireRoles('admin', 'faculty'), validate(updateStudentSchema), updateStudent);
router.delete('/:id', requireRoles('admin'), validate(studentIdParamSchema), deleteStudent);

export default router;
