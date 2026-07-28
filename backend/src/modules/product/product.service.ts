import { prisma } from '../../config/db';
import AppError from '../../utils/AppError';
import {
  CreateProductInput,
  UpdateProductInput,
  CreateStockMovementFromParamInput,
} from './product.schema';
import { PaginationQuery, getPaginationParams } from '../../utils/pagination';

interface GetProductsQuery extends PaginationQuery {
  search?: string;
  category?: string;
  lowStock?: string;
}

interface GetStockMovementsQuery extends PaginationQuery {
  productId?: string;
  movementType?: string;
}

export const createProduct = async (data: CreateProductInput) => {
  const existingProduct = await prisma.product.findUnique({
    where: { sku: data.sku },
  });

  if (existingProduct) {
    throw new AppError(400, 'Product with this SKU already exists');
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unitPrice: data.unitPrice,
      currentStock: data.currentStock ?? 0,
      minStockAlert: data.minStockAlert ?? 5,
      location: data.location,
    },
  });

  return product;
};

export const getProducts = async (query: GetProductsQuery) => {
  const { page, limit, skip } = getPaginationParams(query);
  const where: any = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.lowStock === 'true') {
    const allProducts = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const filteredProducts = allProducts.filter(
      (p) => p.currentStock <= p.minStockAlert
    );

    const totalResults = filteredProducts.length;
    const products = filteredProducts.slice(skip, skip + limit);

    return { products, page, limit, totalResults };
  }

  const [products, totalResults] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, page, limit, totalResults };
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  return product;
};

export const updateProduct = async (
  id: string,
  data: UpdateProductInput
) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (data.sku && data.sku !== product.sku) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw new AppError(400, 'Product with this SKU already exists');
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data,
  });

  return updatedProduct;
};

export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  await prisma.product.delete({ where: { id } });
};

export const createStockMovement = async (
  productId: string,
  userId: string,
  data: CreateStockMovementFromParamInput
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (data.movementType === 'OUT' && product.currentStock < data.quantity) {
    throw new AppError(400, 'Insufficient stock');
  }

  const result = await prisma.$transaction(async (tx) => {
    const stockMovement = await tx.stockMovement.create({
      data: {
        productId,
        quantity: data.quantity,
        movementType: data.movementType,
        reason: data.reason,
        createdBy: userId,
      },
    });

    const newStock =
      data.movementType === 'IN'
        ? product.currentStock + data.quantity
        : product.currentStock - data.quantity;

    await tx.product.update({
      where: { id: productId },
      data: { currentStock: newStock },
    });

    return stockMovement;
  });

  return result;
};

export const getStockMovements = async (query: GetStockMovementsQuery) => {
  const { page, limit, skip } = getPaginationParams(query);
  const where: any = {};

  if (query.productId) {
    where.productId = query.productId;
  }

  if (query.movementType) {
    where.movementType = query.movementType;
  }

  const [stockMovements, totalResults] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { stockMovements, page, limit, totalResults };
};
