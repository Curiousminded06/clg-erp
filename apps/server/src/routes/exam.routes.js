import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createExam,
  deleteExam,
  getExamById,
  listExams,
  updateExam
} from '../modules/exam/exam.controller.js';
import {
  createExamSchema,
  examIdSchema,
  listExamSchema,
  updateExamSchema
} from '../modules/exam/exam.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles('admin', 'faculty'), validate(listExamSchema), listExams);
router.get('/:id', requireRoles('admin', 'faculty'), validate(examIdSchema), getExamById);
router.post('/', requireRoles('admin', 'faculty'), validate(createExamSchema), createExam);
router.patch('/:id', requireRoles('admin', 'faculty'), validate(updateExamSchema), updateExam);
router.delete('/:id', requireRoles('admin'), validate(examIdSchema), deleteExam);

export default router;
