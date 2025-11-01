import { z, ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Validate a specific part of the request (body, query, params, headers)
 * Example:
 *   app.post("/user", validate(userSchema, "body"), handler)
 */
export const validate =
  (schema: ZodTypeAny, target: 'body' | 'query' | 'params' | 'headers') =>
  (req: Request, res: Response, next: NextFunction) => {
    const data = (req as any)[target];
    const result = schema.safeParse(data);

    if (!result.success) {
      return res.status(400).json({
        error: 'ValidationError',
        target,
        issues: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        })),
      });
    }

    // overwrite with validated + coerced data
    (req as any)[target] = result.data;
    next();
  };
