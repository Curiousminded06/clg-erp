import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(160),
    code: z.string().trim().min(2).max(24),
    creditHours: z.coerce.number().int().min(1).max(8),
    semester: z.coerce.number().int().min(1).max(12),
    department: z.string().regex(objectIdRegex, 'Invalid department id')
  })
});

export const updateCourseSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid course id')
  }),
  body: z
    .object({
      title: z.string().trim().min(2).max(160).optional(),
      code: z.string().trim().min(2).max(24).optional(),
      creditHours: z.coerce.number().int().min(1).max(8).optional(),
      semester: z.coerce.number().int().min(1).max(12).optional(),
      department: z.string().regex(objectIdRegex, 'Invalid department id').optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});

export const listCourseSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    department: z.string().regex(objectIdRegex, 'Invalid department id').optional(),
    semester: z.coerce.number().int().min(1).max(12).optional()
  })
});

export const courseIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid course id')
  })
});
