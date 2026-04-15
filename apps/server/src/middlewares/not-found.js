import { AppError } from '../utils/AppError.js';

export function notFound(req, _res, next) {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
}
