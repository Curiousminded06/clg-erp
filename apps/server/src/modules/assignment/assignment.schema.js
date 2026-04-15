import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createAssignmentSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().max(2000).optional().default(''),
    department: z.string().regex(objectIdRegex),
    course: z.string().regex(objectIdRegex),
    dueDate: z.coerce.date(),
    maxPoints: z.coerce.number().int().min(1).max(1000).optional().default(100)
  })
});

export const listAssignmentSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    department: z.string().regex(objectIdRegex).optional(),
    course: z.string().regex(objectIdRegex).optional()
  })
});

export const assignmentIdSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) })
});

export const updateAssignmentSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: z
    .object({
      title: z.string().trim().min(3).max(160).optional(),
      description: z.string().trim().max(2000).optional(),
      dueDate: z.coerce.date().optional(),
      maxPoints: z.coerce.number().int().min(1).max(1000).optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});

export const submitAssignmentSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: z.object({
    content: z.string().trim().min(3).max(5000),
    attachmentUrl: z.string().trim().url().optional().or(z.literal(''))
  })
});

export const listMySubmissionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
});

export const gradeSubmissionSchema = z.object({
  params: z.object({ submissionId: z.string().regex(objectIdRegex) }),
  body: z.object({
    grade: z.coerce.number().min(0).max(1000),
    feedback: z.string().trim().max(2000).optional().default('')
  })
});
