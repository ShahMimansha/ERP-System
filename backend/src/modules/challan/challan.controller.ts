


import { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../utils/AppError';
import { getPaginationParams } from '../../utils/pagination';
import * as challanService from './challan.service';
import { ChallanStatus } from '@prisma/client';

export const createChallan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'User not authenticated'));
    }

    const challan = await challanService.createChallan(req.user.id, req.body);

    res.status(201).json({
      status: 'success',
      data: {
        challan,
      },
    });
  }
);

export const getChallans = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = {
      status: req.query.status as ChallanStatus | undefined,
      customerId: req.query.customerId as string | undefined,
      search: req.query.search as string | undefined,
    };

    const pagination = getPaginationParams(req.query);
    const result = await challanService.getChallans(query, pagination);

    res.status(200).json(result);
  }
);

export const getChallanById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const challan = await challanService.getChallanById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        challan,
      },
    });
  }
);

export const updateChallan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'User not authenticated'));
    }

    const challan = await challanService.updateChallan(req.params.id, req.user.id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        challan,
      },
    });
  }
);

export const confirmChallan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'User not authenticated'));
    }

    const challan = await challanService.confirmChallan(req.params.id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        challan,
      },
    });
  }
);

export const cancelChallan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'User not authenticated'));
    }

    const challan = await challanService.cancelChallan(req.params.id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        challan,
      },
    });
  }
);

export const deleteChallan = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    return next(new AppError(400, 'Challans cannot be deleted, cancel instead'));
  }
);
