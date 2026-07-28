import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError(401, 'You are not logged in! Please log in to get access.')
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return next(
        new AppError(401, 'The user belonging to this token no longer exists.')
      );
    }

    req.user = { id: user.id, role: user.role };
    next();
  }
);

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action.')
      );
    }
    next();
  };
};
