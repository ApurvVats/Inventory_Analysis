import { z } from 'zod';

export const generateReportSchema = z.object({
  body: z.object({
    categoryName: z.string({ required_error: 'Category name is required' }).min(3),
  }),
});

export const listReportsSchema = z.object({
  query: z.object({
    // `z.coerce.number()` string ko number mein badal dega
    page: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce.number().int().positive().optional().default(10),
  }),
});
