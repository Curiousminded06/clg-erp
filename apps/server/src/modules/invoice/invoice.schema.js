import { z } from 'zod';

const objectIdRegex = /^[a-f\d]{24}$/i;
const statusEnum = z.enum(['pending', 'paid', 'overdue']);
const methodEnum = z.enum(['none', 'card', 'upi', 'bank-transfer', 'cash']);

export const createInvoiceSchema = z.object({
  body: z.object({
    student: z.string().regex(objectIdRegex),
    title: z.string().trim().min(2).max(120),
    amount: z.coerce.number().min(0),
    dueDate: z.coerce.date(),
    status: statusEnum.optional(),
    paymentMethod: methodEnum.optional(),
    paymentReference: z.string().trim().max(80).optional()
  })
});

export const listInvoiceSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    student: z.string().regex(objectIdRegex).optional(),
    status: statusEnum.optional()
  })
});

export const invoiceIdSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) })
});

export const updateInvoiceSchema = z.object({
  params: z.object({ id: z.string().regex(objectIdRegex) }),
  body: z
    .object({
      title: z.string().trim().min(2).max(120).optional(),
      amount: z.coerce.number().min(0).optional(),
      dueDate: z.coerce.date().optional(),
      status: statusEnum.optional(),
      paymentMethod: methodEnum.optional(),
      paymentReference: z.string().trim().max(80).optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required')
});
