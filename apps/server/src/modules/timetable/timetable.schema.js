import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

const dayEnum = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

export const createTimetableSchema = z.object({
  body: z.object({
    department: z.string().regex(objectIdRegex),
    course: z.string().regex(objectIdRegex),
    faculty: z.string().regex(objectIdRegex),
    dayOfWeek: dayEnum,
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    room: z.string().trim().min(1).max(50)
  })
});

export const listTimetableSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    department: z.string().regex(objectIdRegex).optional(),
    dayOfWeek: dayEnum.optional()
  })
});

export const timetableIdSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) })
});

export const updateTimetableSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: z
    .object({
      dayOfWeek: dayEnum.optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      room: z.string().trim().min(1).max(50).optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});
