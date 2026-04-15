import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  listDepartments,
  updateDepartment
} from '../modules/department/department.controller.js';
import {
  createDepartmentSchema,
  idParamSchema,
  listDepartmentSchema,
  updateDepartmentSchema
} from '../modules/department/department.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireRoles('admin', 'faculty'), validate(listDepartmentSchema), listDepartments);
router.get('/:id', requireRoles('admin', 'faculty'), validate(idParamSchema), getDepartmentById);
router.post('/', requireRoles('admin'), validate(createDepartmentSchema), createDepartment);
router.patch('/:id', requireRoles('admin'), validate(updateDepartmentSchema), updateDepartment);
router.delete('/:id', requireRoles('admin'), validate(idParamSchema), deleteDepartment);

export default router;
