import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    code: z.string().trim().min(2).max(16),
    description: z.string().trim().max(500).optional()
  })
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid department id')
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      code: z.string().trim().min(2).max(16).optional(),
      description: z.string().trim().max(500).optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});

export const listDepartmentSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional()
  })
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid id')
  })
});
