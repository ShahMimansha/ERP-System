import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import AppError from '../utils/AppError';

interface PrismaError extends Error {
  code?: string;
  meta?: any;
}

const handleCastErrorDB = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(400, message);
};

const handleDuplicateFieldsDB = (err: PrismaError) => {
  const target = err.meta?.target || [];
  const message = `Duplicate field value: ${target.join(', ')}. Please use another value!`;
  return new AppError(409, message);
};

const handleNotFoundDB = (err: PrismaError) => {
  const message = 'The requested resource was not found.';
  return new AppError(404, message);
};

const handleZodError = (err: ZodError) => {
  const messages = err.errors.map((e) => e.message);
  return new AppError(400, messages.join(', '));
};

const handleJWTError = () =>
  new AppError(401, 'Invalid token. Please log in again!');

const handleJWTExpiredError = () =>
  new AppError(401, 'Your token has expired! Please log in again.');

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.stack = err.stack;

    if (err instanceof ZodError) {
      error = handleZodError(err);
    }

    if (err.code === 'P2002') {
      error = handleDuplicateFieldsDB(err);
    }

    if (err.code === 'P2025') {
      error = handleNotFoundDB(err);
    }

    if (err instanceof JsonWebTokenError) {
      error = handleJWTError();
    }

    if (err instanceof TokenExpiredError) {
      error = handleJWTExpiredError();
    }

    if (err.name === 'CastError') {
      error = handleCastErrorDB(err);
    }

    sendErrorDev(error as AppError, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.isOperational = err.isOperational;
    error.statusCode = err.statusCode;
    error.status = err.status;

    if (err instanceof ZodError) {
      error = handleZodError(err);
    }

    if (err.code === 'P2002') {
      error = handleDuplicateFieldsDB(err);
    }

    if (err.code === 'P2025') {
      error = handleNotFoundDB(err);
    }

    if (err instanceof JsonWebTokenError) {
      error = handleJWTError();
    }

    if (err instanceof TokenExpiredError) {
      error = handleJWTExpiredError();
    }

    if (err.name === 'CastError') {
      error = handleCastErrorDB(err);
    }

    sendErrorProd(error as AppError, res);
  }
};

export default errorHandler;
