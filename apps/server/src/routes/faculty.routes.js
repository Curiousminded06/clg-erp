import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createFaculty, listFaculty } from '../modules/faculty/faculty.controller.js';
import { createFacultySchema, listFacultySchema } from '../modules/faculty/faculty.schema.js';

const router = Router();

router.use(requireAuth, requireRoles('admin'));

router.get('/', validate(listFacultySchema), listFaculty);
router.post('/', validate(createFacultySchema), createFaculty);

export default router;