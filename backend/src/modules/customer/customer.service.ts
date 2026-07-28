import prisma from '../../config/db';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateFollowUpInput,
} from './customer.schema';
import { CustomerStatus, CustomerType } from '@prisma/client';

interface GetCustomersQuery {
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
  page?: number;
  limit?: number;
}

export const createCustomer = async (data: CreateCustomerInput) => {
  return prisma.customer.create({
    data,
  });
};

export const getCustomers = async (query: GetCustomersQuery) => {
  const { search, status, customerType, page = 1, limit = 10 } = query;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (customerType) {
    where.customerType = customerType;
  }

  const [customers, totalResults] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { followUps: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const results = customers.map((customer) => ({
    ...customer,
    followUpsCount: customer._count.followUps,
    _count: undefined,
  }));

  return {
    results,
    page,
    limit,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
};

export const getCustomerById = async (id: string) => {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      followUps: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });
};

export const updateCustomer = async (
  id: string,
  data: UpdateCustomerInput
) => {
  return prisma.customer.update({
    where: { id },
    data,
  });
};

export const deleteCustomer = async (id: string) => {
  return prisma.customer.delete({
    where: { id },
  });
};

export const addFollowUp = async (
  customerId: string,
  userId: string,
  content: string
) => {
  return prisma.followUp.create({
    data: {
      customerId,
      createdBy: userId,
      content,
    },
    include: {
      user: {
        select: { name: true },
      },
    },
  });
};

export const getFollowUpsByCustomer = async (customerId: string) => {
  return prisma.followUp.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true },
      },
    },
  });
};
