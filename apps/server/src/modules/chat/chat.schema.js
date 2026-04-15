import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const listChatCoursesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(100)
  })
});

export const listCourseMessagesSchema = z.object({
  params: z.object({
    courseId: z.string().regex(objectIdRegex)
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
});
