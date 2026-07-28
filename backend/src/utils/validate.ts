import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import AppError from './AppError';

export const validate = (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return next(new AppError(400, `Validation error: ${JSON.stringify(errors)}`));
    }

    req[target] = result.data;
    next();
  };
};

export default validate;
