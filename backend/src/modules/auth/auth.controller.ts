import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../utils/AppError';
import { hashPassword, comparePassword, signToken } from './auth.service';
import { UserRole } from '@prisma/client';

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return next(new AppError(401, 'Incorrect email or password'));
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }
);

export const seed = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = [
      {
        email: 'admin@erp.com',
        password: 'admin123',
        name: 'Admin User',
        role: UserRole.ADMIN,
      },
      {
        email: 'sales@erp.com',
        password: 'sales123',
        name: 'Sales User',
        role: UserRole.SALES,
      },
      {
        email: 'warehouse@erp.com',
        password: 'warehouse123',
        name: 'Warehouse User',
        role: UserRole.WAREHOUSE,
      },
      {
        email: 'accounts@erp.com',
        password: 'accounts123',
        name: 'Accounts User',
        role: UserRole.ACCOUNTS,
      },
    ];

    const createdUsers: string[] = [];
    const existingUsers: string[] = [];

    for (const user of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        existingUsers.push(user.email);
        continue;
      }

      const hashedPassword = await hashPassword(user.password);
      await prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          name: user.name,
          role: user.role,
        },
      });
      createdUsers.push(user.email);
    }

    res.status(200).json({
      status: 'success',
      message: 'Seed operation completed',
      data: {
        created: createdUsers,
        alreadyExisted: existingUsers,
      },
    });
  }
);
