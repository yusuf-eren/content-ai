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

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type RegisterRequest = Request<{}, {}, RegisterSchema>;

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type LoginRequest = Request<{}, {}, LoginSchema>;

export const generationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  type: z.enum(['summary', 'podcast', 'learning', 'voice_explanation']).optional(),
});

export type GenerationsQuerySchema = z.infer<typeof generationsQuerySchema>;
export type GenerationsRequest = Request<{}, {}, {}, GenerationsQuerySchema>;

export const generationParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
});

export type GenerationParamsSchema = z.infer<typeof generationParamsSchema>;
export type GenerationDetailRequest = Request<GenerationParamsSchema>;
