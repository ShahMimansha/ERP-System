import { prisma } from '../../config/db';
import AppError from '../../utils/AppError';
import { ChallanStatus, MovementType } from '@prisma/client';
import { CreateChallanInput, UpdateChallanInput, ChallanItemInput } from './challan.schema';
import { PaginationParams, PaginatedResult, buildPaginatedResult } from '../../utils/pagination';

interface ChallanItemWithProduct extends ChallanItemInput {
  productSnapshotName: string;
  productSnapshotPrice: number;
}

const fetchProductSnapshots = async (items: ChallanItemInput[]): Promise<ChallanItemWithProduct[]> => {
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, unitPrice: true, currentStock: true },
  });

  return items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new AppError(404, `Product not found: ${item.productId}`);
    }
    return {
      ...item,
      productSnapshotName: product.name,
      productSnapshotPrice: Number(product.unitPrice),
    };
  });
};

const validateStock = async (items: ChallanItemInput[]): Promise<void> => {
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, currentStock: true },
  });

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new AppError(404, `Product not found: ${item.productId}`);
    }
    if (product.currentStock < item.quantity) {
      throw new AppError(400, `Insufficient stock for product ${product.name}`);
    }
  }
};

const buildItemsData = (challanId: string, items: ChallanItemWithProduct[]) => {
  return items.map((item) => ({
    challanId,
    productId: item.productId,
    productSnapshotName: item.productSnapshotName,
    productSnapshotPrice: item.productSnapshotPrice,
    quantity: item.quantity,
  }));
};

const buildStockMovementsData = (
  challanNumber: number,
  items: ChallanItemInput[],
  userId: string,
  movementType: MovementType,
  reasonTemplate: string
) => {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    movementType,
    reason: reasonTemplate.replace('#challanNumber', String(challanNumber)),
    createdBy: userId,
  }));
};

const buildStockUpdates = (items: ChallanItemInput[], deduct: boolean) => {
  return items.map((item) => ({
    where: { id: item.productId },
    data: {
      currentStock: {
        [deduct ? 'decrement' : 'increment']: item.quantity,
      },
    },
  }));
};

export const createChallan = async (userId: string, data: CreateChallanInput) => {
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const itemsWithSnapshots = await fetchProductSnapshots(data.items);
  const status = data.status || ChallanStatus.DRAFT;

  if (status === ChallanStatus.CONFIRMED) {
    await validateStock(data.items);

    return await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.create({
        data: {
          customerId: data.customerId,
          status: ChallanStatus.CONFIRMED,
          totalQuantity,
          createdBy: userId,
        },
      });

      const challanItemsData = buildItemsData(challan.id, itemsWithSnapshots);
      await tx.challanItem.createMany({ data: challanItemsData });

      const stockUpdates = buildStockUpdates(data.items, true);
      for (const update of stockUpdates) {
        await tx.product.update(update);
      }

      const movementsData = buildStockMovementsData(
        challan.challanNumber,
        data.items,
        userId,
        MovementType.OUT,
        'Challan #challanNumber'
      );
      await tx.stockMovement.createMany({ data: movementsData });

      return challan;
    });
  }

  return await prisma.challan.create({
    data: {
      customerId: data.customerId,
      status: ChallanStatus.DRAFT,
      totalQuantity,
      createdBy: userId,
      items: {
        create: buildItemsData('', itemsWithSnapshots).map(({ challanId, ...rest }) => rest),
      },
    },
    include: {
      items: true,
    },
  });
};

interface GetChallansQuery {
  status?: ChallanStatus;
  customerId?: string;
  search?: string;
}

export const getChallans = async (
  query: GetChallansQuery,
  pagination: PaginationParams
): Promise<PaginatedResult<any>> => {
  const where: any = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.customerId) {
    where.customerId = query.customerId;
  }

  if (query.search) {
    const searchNum = parseInt(query.search);
    if (!isNaN(searchNum)) {
      where.challanNumber = searchNum;
    }
  }

  const [totalResults, results] = await Promise.all([
    prisma.challan.count({ where }),
    prisma.challan.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { name: true },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
  ]);

  const transformedResults = results.map((challan: any) => ({
    ...challan,
    customerName: challan.customer?.name,
    itemsCount: challan._count?.items,
    customer: undefined,
    _count: undefined,
  }));

  return buildPaginatedResult(transformedResults, totalResults, pagination.page, pagination.limit);
};

export const getChallanById = async (id: string) => {
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            select: { id: true, name: true, sku: true },
          },
        },
      },
      user: {
        select: { name: true },
      },
    },
  });

  if (!challan) {
    throw new AppError(404, 'Challan not found');
  }

  return {
    ...challan,
    createdByName: challan.user?.name,
    user: undefined,
  };
};

export const updateChallan = async (
  id: string,
  userId: string,
  data: UpdateChallanInput
) => {
  const existingChallan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existingChallan) {
    throw new AppError(404, 'Challan not found');
  }

  if (existingChallan.status !== ChallanStatus.DRAFT) {
    throw new AppError(400, 'Only DRAFT challans can be updated');
  }

  if (data.items) {
    const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemsWithSnapshots = await fetchProductSnapshots(data.items);

    if (data.status === ChallanStatus.CONFIRMED) {
      await validateStock(data.items);

      return await prisma.$transaction(async (tx) => {
        await tx.challanItem.deleteMany({ where: { challanId: id } });

        const updatedChallan = await tx.challan.update({
          where: { id },
          data: {
            status: ChallanStatus.CONFIRMED,
            totalQuantity,
          },
        });

        const challanItemsData = buildItemsData(id, itemsWithSnapshots);
        await tx.challanItem.createMany({ data: challanItemsData });

        const stockUpdates = buildStockUpdates(data.items!, true);
        for (const update of stockUpdates) {
          await tx.product.update(update);
        }

        const movementsData = buildStockMovementsData(
          updatedChallan.challanNumber,
          data.items!,
          userId,
          MovementType.OUT,
          'Challan #challanNumber'
        );
        await tx.stockMovement.createMany({ data: movementsData });

        return updatedChallan;
      });
    }

    await prisma.challanItem.deleteMany({ where: { challanId: id } });

    return await prisma.challan.update({
      where: { id },
      data: {
        totalQuantity,
        status: data.status || existingChallan.status,
        items: {
          create: buildItemsData('', itemsWithSnapshots).map(({ challanId, ...rest }) => rest),
        },
      },
      include: { items: true },
    });
  }

  if (data.status === ChallanStatus.CONFIRMED && existingChallan.status === ChallanStatus.DRAFT) {
    return confirmChallan(id, userId);
  }

  return await prisma.challan.update({
    where: { id },
    data: {
      status: data.status,
    },
  });
};

export const cancelChallan = async (id: string, userId: string) => {
  const existingChallan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existingChallan) {
    throw new AppError(404, 'Challan not found');
  }

  if (existingChallan.status === ChallanStatus.CANCELLED) {
    throw new AppError(400, 'Challan is already cancelled');
  }

  if (existingChallan.status === ChallanStatus.CONFIRMED) {
    return await prisma.$transaction(async (tx) => {
      const updatedChallan = await tx.challan.update({
        where: { id },
        data: { status: ChallanStatus.CANCELLED },
      });

      const items: ChallanItemInput[] = existingChallan.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const stockUpdates = buildStockUpdates(items, false);
      for (const update of stockUpdates) {
        await tx.product.update(update);
      }

      const movementsData = buildStockMovementsData(
        existingChallan.challanNumber,
        items,
        userId,
        MovementType.IN,
        'Challan cancelled #challanNumber'
      );
      await tx.stockMovement.createMany({ data: movementsData });

      return updatedChallan;
    });
  }

  return await prisma.challan.update({
    where: { id },
    data: { status: ChallanStatus.CANCELLED },
  });
};

export const confirmChallan = async (id: string, userId: string) => {
  const existingChallan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existingChallan) {
    throw new AppError(404, 'Challan not found');
  }

  if (existingChallan.status !== ChallanStatus.DRAFT) {
    throw new AppError(400, 'Only DRAFT challans can be confirmed');
  }

  const items: ChallanItemInput[] = existingChallan.items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }));

  await validateStock(items);

  return await prisma.$transaction(async (tx) => {
    const updatedChallan = await tx.challan.update({
      where: { id },
      data: { status: ChallanStatus.CONFIRMED },
    });

    const stockUpdates = buildStockUpdates(items, true);
    for (const update of stockUpdates) {
      await tx.product.update(update);
    }

    const movementsData = buildStockMovementsData(
      existingChallan.challanNumber,
      items,
      userId,
      MovementType.OUT,
      'Challan #challanNumber'
    );
    await tx.stockMovement.createMany({ data: movementsData });

    return updatedChallan;
  });
};
