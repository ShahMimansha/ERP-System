import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanItemSchema = z.object({
  productId: z.string({
    required_error: 'Product ID is required',
    invalid_type_error: 'Product ID must be a string',
  }),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than 0'),
});

export const createChallanSchema = z.object({
  customerId: z.string({
    required_error: 'Customer ID is required',
    invalid_type_error: 'Customer ID must be a string',
  }),
  items: z
    .array(challanItemSchema, {
      required_error: 'Items are required',
      invalid_type_error: 'Items must be an array',
    })
    .min(1, 'At least one item is required'),
  status: z
    .nativeEnum(ChallanStatus, {
      invalid_type_error: 'Invalid status value',
    })
    .default(ChallanStatus.DRAFT)
    .optional(),
});

export const updateChallanSchema = z.object({
  items: z
    .array(challanItemSchema)
    .min(1, 'At least one item is required')
    .optional(),
  status: z
    .nativeEnum(ChallanStatus, {
      invalid_type_error: 'Invalid status value',
    })
    .optional(),
});

export type ChallanItemInput = z.infer<typeof challanItemSchema>;
export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
