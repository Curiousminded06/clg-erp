import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;

const createStudentBodySchema = z
  .object({
    user: z.string().regex(objectIdRegex, 'Invalid user id').optional(),
    fullName: z.string().trim().min(2).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).max(64).optional(),
    enrollmentNo: z.string().trim().min(3).max(40),
    department: z.string().regex(objectIdRegex, 'Invalid department id'),
    semester: z.coerce.number().int().min(1).max(12),
    section: z.string().trim().min(1).max(10),
    dob: z.coerce.date(),
    phone: z.string().trim().max(25).optional(),
    address: z.string().trim().max(300).optional(),
    active: z.boolean().optional()
  })
  .refine(
    (data) => Boolean(data.user) || (Boolean(data.fullName) && Boolean(data.email) && Boolean(data.password)),
    'Provide either an existing user id or fullName, email, and password to create a new student account'
  );

export const createStudentSchema = z.object({
  body: createStudentBodySchema
});

export const updateStudentSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid student id')
  }),
  body: z
    .object({
      enrollmentNo: z.string().trim().min(3).max(40).optional(),
      department: z.string().regex(objectIdRegex, 'Invalid department id').optional(),
      semester: z.coerce.number().int().min(1).max(12).optional(),
      section: z.string().trim().min(1).max(10).optional(),
      dob: z.coerce.date().optional(),
      phone: z.string().trim().max(25).optional(),
      address: z.string().trim().max(300).optional(),
      active: z.boolean().optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});

export const listStudentSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
    department: z.string().regex(objectIdRegex, 'Invalid department id').optional(),
    semester: z.coerce.number().int().min(1).max(12).optional(),
    active: z
      .string()
      .optional()
      .transform((value) => (value == null ? undefined : value === 'true'))
  })
});

export const studentIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid student id')
  })
});
