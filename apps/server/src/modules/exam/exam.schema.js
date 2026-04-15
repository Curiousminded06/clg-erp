import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;
const examType = z.enum(['quiz', 'midterm', 'final', 'practical']);

export const createExamSchema = z.object({
  body: z.object({
    department: z.string().regex(objectIdRegex),
    course: z.string().regex(objectIdRegex),
    examType,
    date: z.coerce.date(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    maxMarks: z.coerce.number().int().min(1).max(1000)
  })
});

export const listExamSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    department: z.string().regex(objectIdRegex).optional(),
    examType: examType.optional()
  })
});

export const examIdSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) })
});

export const updateExamSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: z
    .object({
      examType: examType.optional(),
      date: z.coerce.date().optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      maxMarks: z.coerce.number().int().min(1).max(1000).optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});
