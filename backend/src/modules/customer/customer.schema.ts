import { z } from 'zod';

const customerTypeEnum = z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']);
const customerStatusEnum = z.enum(['LEAD', 'ACTIVE', 'INACTIVE']);

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(1, 'Mobile number is required'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(1, 'Business name is required'),
  gstNumber: z.string().optional(),
  customerType: customerTypeEnum,
  address: z.string().min(1, 'Address is required'),
  status: customerStatusEnum,
  followUpDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  mobile: z.string().min(1, 'Mobile number is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  businessName: z.string().min(1, 'Business name is required').optional(),
  gstNumber: z.string().nullable().optional(),
  customerType: customerTypeEnum.optional(),
  address: z.string().min(1, 'Address is required').optional(),
  status: customerStatusEnum.optional(),
  followUpDate: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const createFollowUpSchema = z.object({
  content: z.string().min(1, 'Follow-up content is required'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;