import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { atRiskSchema, dashboardSchema, exportSchema, searchSchema } from '../modules/report/report.schema.js';
import { exportReport, getAtRiskStudents, getDashboard, searchCampusRecords } from '../modules/report/report.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', validate(dashboardSchema), getDashboard);
router.get('/at-risk', requireRoles('admin', 'faculty'), validate(atRiskSchema), getAtRiskStudents);
router.get('/search', requireRoles('admin', 'faculty'), validate(searchSchema), searchCampusRecords);
router.get('/export', requireRoles('admin', 'faculty'), validate(exportSchema), exportReport);

export default router;