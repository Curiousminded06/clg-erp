import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
  }

  if (err instanceof ZodError || err?.name === 'ZodError') {
    const issues = err.issues ?? [];
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    });
  }

  logger.error({ err }, 'Unhandled server error');
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    ...(env.NODE_ENV !== 'production' ? { details: err?.message } : {})
  });
}
