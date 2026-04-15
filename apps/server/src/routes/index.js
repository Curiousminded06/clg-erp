import { Router } from 'express';
import assignmentRoutes from './assignment.routes.js';
import attendanceRoutes from './attendance.routes.js';
import authRoutes from './auth.routes.js';
import campusRoutes from './campus.routes.js';
import chatRoutes from './chat.routes.js';
import courseRoutes from './course.routes.js';
import departmentRoutes from './department.routes.js';
import facultyRoutes from './faculty.routes.js';
import examRoutes from './exam.routes.js';
import healthRoutes from './health.routes.js';
import invoiceRoutes from './invoice.routes.js';
import noticeRoutes from './notice.routes.js';
import reportRoutes from './report.routes.js';
import studentRoutes from './student.routes.js';
import timetableRoutes from './timetable.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/courses', courseRoutes);
router.use('/faculty', facultyRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/timetables', timetableRoutes);
router.use('/exams', examRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/chat', chatRoutes);
router.use('/notices', noticeRoutes);
router.use('/campus-updates', campusRoutes);
router.use('/reports', reportRoutes);

export default router;
