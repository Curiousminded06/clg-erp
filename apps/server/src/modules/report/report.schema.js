import { z } from 'zod';

export const dashboardSchema = z.object({
  query: z.object({}).passthrough().optional()
});

export const atRiskSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10)
  })
});

export const searchSchema = z.object({
  query: z.object({
    q: z.string().trim().min(2),
    limit: z.coerce.number().int().min(1).max(20).default(8)
  })
});

export const exportSchema = z.object({
  query: z.object({
    type: z.enum(['dashboard', 'at-risk']).default('dashboard'),
    format: z.enum(['csv', 'pdf']).default('csv')
  })
});