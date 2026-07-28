import { Request, Response, NextFunction } from 'express';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../utils/AppError';
import { createPaginatedResponse } from '../../utils/pagination';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createStockMovement,
  getStockMovements,
} from './product.service';
import { CreateStockMovementFromParamInput } from './product.schema';

export const createProductHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await createProduct(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        product,
      },
    });
  }
);

export const getProductsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { products, page, limit, totalResults } = await getProducts(req.query);

    const response = createPaginatedResponse(products, page, limit, totalResults);

    res.status(200).json(response);
  }
);

export const getProductByIdHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const product = await getProductById(id);

    if (!product) {
      return next(new AppError(404, 'Product not found'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    });
  }
);

export const updateProductHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const product = await updateProduct(id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    });
  }
);

export const deleteProductHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await deleteProduct(id);

    res.status(204).send();
  }
);

export const createStockMovementHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const body = req.body as CreateStockMovementFromParamInput;

    const stockMovement = await createStockMovement(id, userId, body);

    res.status(201).json({
      status: 'success',
      data: {
        stockMovement,
      },
    });
  }
);

export const getStockMovementsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { stockMovements, page, limit, totalResults } = await getStockMovements(
      req.query
    );

    const response = createPaginatedResponse(
      stockMovements,
      page,
      limit,
      totalResults
    );

    res.status(200).json(response);
  }
);
