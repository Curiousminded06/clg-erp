import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createAttendanceSchema = z.object({
  body: z.object({
    student: z.string().regex(objectIdRegex),
    course: z.string().regex(objectIdRegex),
    faculty: z.string().regex(objectIdRegex),
    date: z.coerce.date(),
    status: z.enum(['present', 'absent', 'late']),
    remarks: z.string().trim().max(300).optional()
  })
});

export const listAttendanceSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    student: z.string().regex(objectIdRegex).optional(),
    course: z.string().regex(objectIdRegex).optional(),
    status: z.enum(['present', 'absent', 'late']).optional()
  })
});

export const attendanceIdSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex)
  })
});

export const updateAttendanceSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex)
  }),
  body: z
    .object({
      date: z.coerce.date().optional(),
      status: z.enum(['present', 'absent', 'late']).optional(),
      remarks: z.string().trim().max(300).optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});
