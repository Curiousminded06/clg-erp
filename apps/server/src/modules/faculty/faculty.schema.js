import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createFacultySchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(64)
  })
});

export const listFacultySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    role: z.enum(['faculty']).optional()
  })
});

export const facultyIdSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid user id')
  })
});