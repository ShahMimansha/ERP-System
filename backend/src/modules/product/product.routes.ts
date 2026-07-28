import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth';
import { validate } from '../../utils/validate';
import {
  createProductSchema,
  updateProductSchema,
  createStockMovementFromParamSchema,
} from './product.schema';
import {
  createProductHandler,
  getProductsHandler,
  getProductByIdHandler,
  updateProductHandler,
  deleteProductHandler,
  createStockMovementHandler,
  getStockMovementsHandler,
} from './product.controller';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(restrictTo('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProductsHandler)
  .post(
    restrictTo('ADMIN', 'WAREHOUSE'),
    validate(createProductSchema),
    createProductHandler
  );

router
  .route('/stock-movements')
  .get(restrictTo('ADMIN', 'WAREHOUSE'), getStockMovementsHandler);

router
  .route('/:id')
  .get(restrictTo('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProductByIdHandler)
  .patch(
    restrictTo('ADMIN', 'WAREHOUSE'),
    validate(updateProductSchema),
    updateProductHandler
  )
  .delete(restrictTo('ADMIN'), deleteProductHandler);

router
  .route('/:id/stock-movements')
  .post(
    restrictTo('ADMIN', 'WAREHOUSE'),
    validate(createStockMovementFromParamSchema),
    createStockMovementHandler
  );

export default router;
