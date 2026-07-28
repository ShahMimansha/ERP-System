import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth';
import { validate } from '../../utils/validate';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createFollowUpSchema,
} from './customer.schema';
import {
  createCustomerHandler,
  getCustomersHandler,
  getCustomerByIdHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
  addFollowUpHandler,
  getFollowUpsHandler,
} from './customer.controller';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(
    restrictTo(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS),
    getCustomersHandler
  )
  .post(
    restrictTo(UserRole.ADMIN, UserRole.SALES),
    validate(createCustomerSchema),
    createCustomerHandler
  );

router
  .route('/:id')
  .get(
    restrictTo(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS),
    getCustomerByIdHandler
  )
  .patch(
    restrictTo(UserRole.ADMIN, UserRole.SALES),
    validate(updateCustomerSchema),
    updateCustomerHandler
  )
  .delete(restrictTo(UserRole.ADMIN), deleteCustomerHandler);

router
  .route('/:id/followups')
  .get(
    restrictTo(UserRole.ADMIN, UserRole.SALES, UserRole.ACCOUNTS),
    getFollowUpsHandler
  )
  .post(
    restrictTo(UserRole.ADMIN, UserRole.SALES),
    validate(createFollowUpSchema),
    addFollowUpHandler
  );

export default router;
