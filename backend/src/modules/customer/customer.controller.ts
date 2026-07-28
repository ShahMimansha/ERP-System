import { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../utils/AppError';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addFollowUp,
  getFollowUpsByCustomer,
} from './customer.service';
import { getPaginationParams } from '../../utils/pagination';
import { CustomerStatus, CustomerType } from '@prisma/client';

export const createCustomerHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const customer = await createCustomer(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        customer,
      },
    });
  }
);

export const getCustomersHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const search = req.query.search as string | undefined;
    const status = req.query.status as CustomerStatus | undefined;
    const customerType = req.query.customerType as CustomerType | undefined;

    const result = await getCustomers({
      search,
      status,
      customerType,
      page,
      limit,
    });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
);

export const getCustomerByIdHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const customer = await getCustomerById(req.params.id);

    if (!customer) {
      return next(new AppError(404, 'Customer not found'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        customer,
      },
    });
  }
);

export const updateCustomerHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const customer = await getCustomerById(req.params.id);

    if (!customer) {
      return next(new AppError(404, 'Customer not found'));
    }

    const updatedCustomer = await updateCustomer(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        customer: updatedCustomer,
      },
    });
  }
);

export const deleteCustomerHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const customer = await getCustomerById(req.params.id);

    if (!customer) {
      return next(new AppError(404, 'Customer not found'));
    }

    await deleteCustomer(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

export const addFollowUpHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const customer = await getCustomerById(req.params.id);

    if (!customer) {
      return next(new AppError(404, 'Customer not found'));
    }

    if (!req.user) {
      return next(new AppError(401, 'User not authenticated'));
    }

    const followUp = await addFollowUp(
      req.params.id,
      req.user.id,
      req.body.content
    );

    res.status(201).json({
      status: 'success',
      data: {
        followUp,
      },
    });
  }
);

export const getFollowUpsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const customer = await getCustomerById(req.params.id);

    if (!customer) {
      return next(new AppError(404, 'Customer not found'));
    }

    const followUps = await getFollowUpsByCustomer(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        followUps,
      },
    });
  }
);
