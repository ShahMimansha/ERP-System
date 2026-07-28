import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  sku: z.string().min(1, { message: 'SKU is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  unitPrice: z
    .number({
      required_error: 'Unit price is required',
      invalid_type_error: 'Unit price must be a number',
    })
    .positive({ message: 'Unit price must be positive' }),
  currentStock: z
    .number()
    .int({ message: 'Current stock must be an integer' })
    .min(0, { message: 'Current stock must be greater than or equal to 0' })
    .optional(),
  minStockAlert: z
    .number()
    .int({ message: 'Minimum stock alert must be an integer' })
    .min(0, { message: 'Minimum stock alert must be greater than or equal to 0' })
    .optional(),
  location: z.string().min(1, { message: 'Location is required' }),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).optional(),
  sku: z.string().min(1, { message: 'SKU is required' }).optional(),
  category: z.string().min(1, { message: 'Category is required' }).optional(),
  unitPrice: z
    .number({
      invalid_type_error: 'Unit price must be a number',
    })
    .positive({ message: 'Unit price must be positive' })
    .optional(),
  currentStock: z
    .number()
    .int({ message: 'Current stock must be an integer' })
    .min(0, { message: 'Current stock must be greater than or equal to 0' })
    .optional(),
  minStockAlert: z
    .number()
    .int({ message: 'Minimum stock alert must be an integer' })
    .min(0, { message: 'Minimum stock alert must be greater than or equal to 0' })
    .optional(),
  location: z.string().min(1, { message: 'Location is required' }).optional(),
});

export const createStockMovementSchema = z.object({
  productId: z.string().min(1, { message: 'Product ID is required' }),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int({ message: 'Quantity must be an integer' })
    .positive({ message: 'Quantity must be greater than 0' }),
  movementType: z.enum(['IN', 'OUT'], {
    required_error: 'Movement type is required',
    invalid_type_error: 'Movement type must be IN or OUT',
  }),
  reason: z.string().min(1, { message: 'Reason is required' }),
});

export const createStockMovementFromParamSchema = z.object({
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .int({ message: 'Quantity must be an integer' })
    .positive({ message: 'Quantity must be greater than 0' }),
  movementType: z.enum(['IN', 'OUT'], {
    required_error: 'Movement type is required',
    invalid_type_error: 'Movement type must be IN or OUT',
  }),
  reason: z.string().min(1, { message: 'Reason is required' }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type CreateStockMovementFromParamInput = z.infer<typeof createStockMovementFromParamSchema>;
