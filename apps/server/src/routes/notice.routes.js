import { Router } from 'express';
import { requireAuth, requireRoles } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createNotice, deleteNotice, listNotices, updateNotice } from '../modules/notice/notice.controller.js';
import { createNoticeSchema, listNoticeSchema, noticeIdSchema, updateNoticeSchema } from '../modules/notice/notice.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listNoticeSchema), listNotices);
router.post('/', requireRoles('faculty'), validate(createNoticeSchema), createNotice);
router.patch('/:id', requireRoles('faculty'), validate(updateNoticeSchema), updateNotice);
router.delete('/:id', requireRoles('faculty'), validate(noticeIdSchema), deleteNotice);

export default router;
