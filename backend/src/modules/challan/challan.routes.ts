import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { protect, restrictTo } from '../../middleware/auth';
import validate from '../../utils/validate';
import { createChallanSchema, updateChallanSchema } from './challan.schema';
import * as challanController from './challan.controller';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(restrictTo(UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE, UserRole.ACCOUNTS), challanController.getChallans)
  .post(restrictTo(UserRole.ADMIN, UserRole.SALES), validate(createChallanSchema), challanController.createChallan);

router
  .route('/:id')
  .get(restrictTo(UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE, UserRole.ACCOUNTS), challanController.getChallanById)
  .patch(restrictTo(UserRole.ADMIN, UserRole.SALES), validate(updateChallanSchema), challanController.updateChallan)
  .delete(challanController.deleteChallan);

router.patch('/:id/confirm', restrictTo(UserRole.ADMIN, UserRole.SALES), challanController.confirmChallan);
router.patch('/:id/cancel', restrictTo(UserRole.ADMIN), challanController.cancelChallan);

export default router;
