import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { listChatCourses, listCourseMessages } from '../modules/chat/chat.controller.js';
import { listChatCoursesSchema, listCourseMessagesSchema } from '../modules/chat/chat.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/courses', validate(listChatCoursesSchema), listChatCourses);
router.get('/messages/:courseId', validate(listCourseMessagesSchema), listCourseMessages);

export default router;
