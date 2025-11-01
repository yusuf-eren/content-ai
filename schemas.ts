import { Request } from 'express';
import { z } from 'zod';

export const summarizeSchema = z.object({
  contentUrl: z.url(),
  ultra: z.boolean().optional().default(false),
});

export type SummarizeSchema = z.infer<typeof summarizeSchema>;
export type SummarizeRequest = Request<{}, {}, SummarizeSchema>;

export const dubbingSchema = z.object({
  text: z.string(),
});

export type DubbingSchema = z.infer<typeof dubbingSchema>;
export type DubbingRequest = Request<{}, {}, DubbingSchema>;
