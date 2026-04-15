import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createCourse,
  deleteCourse,
  getCourseById,
  listCourses,
  updateCourse
} from '../modules/course/course.controller.js';
import {
  courseIdParamSchema,
  createCourseSchema,
  listCourseSchema,
  updateCourseSchema
} from '../modules/course/course.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles('admin', 'faculty'), validate(listCourseSchema), listCourses);
router.get('/:id', requireRoles('admin', 'faculty'), validate(courseIdParamSchema), getCourseById);
router.post('/', requireRoles('admin', 'faculty'), validate(createCourseSchema), createCourse);
router.patch('/:id', requireRoles('admin', 'faculty'), validate(updateCourseSchema), updateCourse);
router.delete('/:id', requireRoles('admin'), validate(courseIdParamSchema), deleteCourse);

export default router;
