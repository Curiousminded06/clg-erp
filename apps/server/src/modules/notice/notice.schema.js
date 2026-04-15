import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createNoticeSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(160),
    message: z.string().trim().min(3).max(3000),
    audience: z.enum(['all', 'students', 'faculty']).optional().default('all'),
    department: z.string().regex(objectIdRegex).optional(),
    expiresAt: z.coerce.date().optional()
  })
});

export const listNoticeSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    audience: z.enum(['all', 'students', 'faculty']).optional(),
    department: z.string().regex(objectIdRegex).optional()
  })
});

export const noticeIdSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) })
});

export const updateNoticeSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: z
    .object({
      title: z.string().trim().min(3).max(160).optional(),
      message: z.string().trim().min(3).max(3000).optional(),
      audience: z.enum(['all', 'students', 'faculty']).optional(),
      department: z.string().regex(objectIdRegex).optional(),
      expiresAt: z.coerce.date().nullable().optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});
