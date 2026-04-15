import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createAssignment,
  deleteAssignment,
  gradeAssignmentSubmission,
  listAssignments,
  listAssignmentSubmissions,
  listMySubmissions,
  submitAssignment,
  updateAssignment
} from '../modules/assignment/assignment.controller.js';
import {
  assignmentIdSchema,
  createAssignmentSchema,
  gradeSubmissionSchema,
  listAssignmentSchema,
  listMySubmissionsSchema,
  submitAssignmentSchema,
  updateAssignmentSchema
} from '../modules/assignment/assignment.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listAssignmentSchema), listAssignments);
router.post('/', requireRoles('faculty'), validate(createAssignmentSchema), createAssignment);
router.patch('/:id', requireRoles('faculty'), validate(updateAssignmentSchema), updateAssignment);
router.delete('/:id', requireRoles('faculty'), validate(assignmentIdSchema), deleteAssignment);

router.post('/:id/submissions', requireRoles('student'), validate(submitAssignmentSchema), submitAssignment);
router.get('/:id/submissions', requireRoles('faculty'), validate(assignmentIdSchema), listAssignmentSubmissions);
router.get('/submissions/me', requireRoles('student'), validate(listMySubmissionsSchema), listMySubmissions);
router.patch(
  '/submissions/:submissionId/grade',
  requireRoles('faculty'),
  validate(gradeSubmissionSchema),
  gradeAssignmentSubmission
);

export default router;
