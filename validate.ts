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

    // Overwrite with validated + coerced data
    // For query, store in a separate property since req.query is read-only in Express 5
    if (target === 'query') {
      (req as any).validatedQuery = result.data;
      // Try to merge into req.query if possible
      try {
        Object.assign(req.query, result.data);
      } catch {
        // If assignment fails, validatedQuery will be used instead
      }
    } else {
      (req as any)[target] = result.data;
    }
    next();
  };
