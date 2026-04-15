import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

const campusType = z.enum(['event', 'achievement']);

export const createCampusUpdateSchema = z.object({
  body: z.object({
    type: campusType,
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(3).max(4000),
    date: z.coerce.date(),
    location: z.string().trim().max(200).optional().default('')
  })
});

export const listCampusUpdateSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: campusType.optional()
  })
});

export const campusUpdateIdSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) })
});

export const updateCampusUpdateSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: z
    .object({
      type: campusType.optional(),
      title: z.string().trim().min(3).max(160).optional(),
      description: z.string().trim().min(3).max(4000).optional(),
      date: z.coerce.date().optional(),
      location: z.string().trim().max(200).optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});
