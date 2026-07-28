import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiPackage,
  FiSave,
  FiX,
  FiArrowLeft,
  FiPlus,
  FiMinus,
  FiLoader,
  FiAlertTriangle,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowDownCircle,
  FiArrowUpCircle,
} from 'react-icons/fi';
import api from '../../api/axios';
import type { Product, ProductWithMovements, StockMovement as StockMovementType } from '../../types';
import { MOVEMENT_TYPE } from '../../utils/constants';
import { formatCurrency, formatDate, getStockStatus } from '../../utils/helpers';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  sku: z.string().min(2, 'SKU must be at least 2 characters').max(100),
  category: z.string().min(1, 'Category is required').max(100),
  unitPrice: z.coerce
    .number({ invalid_type_error: 'Unit price is required' })
    .positive('Unit price must be greater than 0'),
  currentStock: z.coerce
    .number({ invalid_type_error: 'Current stock is required' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  minStockAlert: z.coerce
    .number({ invalid_type_error: 'Min stock alert is required' })
    .int('Min stock alert must be a whole number')
    .min(0, 'Min stock alert cannot be negative'),
  location: z.string().max(200).optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

const stockMovementSchema = z.object({
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
  reason: z.string().max(500).optional().or(z.literal('')),
});

type StockMovementFormData = z.infer<typeof stockMovementSchema>;

const getMovementType = (m: StockMovementType) =>
  (m.type as string) || (m.movementType as string);
const getMovementUserName = (m: StockMovementType) =>
  m.userName || m.user?.name || undefined;

const ProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id && id !== 'new';

  const [showStockModal, setShowStockModal] = useState<'add' | 'deduct' | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 0,
      location: '',
    },
  });

  const {
    register: registerStock,
    handleSubmit: handleStockSubmit,
    reset: resetStock,
    formState: { errors: stockErrors, isSubmitting: stockSubmitting },
  } = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      quantity: 1,
      reason: '',
    },
  });

  const { data: productData, isLoading: fetchingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      const raw = response.data?.data?.product as ProductWithMovements | undefined;
      if (!raw) return undefined;
      const movements = (raw.stockMovements || []).map((sm) => ({
        ...sm,
        userName: sm.userName || sm.user?.name,
        type: (sm.type as any) || sm.movementType,
      }));
      return { ...raw, stockMovements: movements } as ProductWithMovements;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (productData) {
      reset({
        name: productData.name,
        sku: productData.sku,
        category: productData.category || '',
        unitPrice: productData.unitPrice,
        currentStock: productData.currentStock,
        minStockAlert: productData.minStockAlert,
        location: productData.location || '',
      });
    }
  }, [productData, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = { ...data, category: data.category || undefined, location: data.location || undefined };
      const response = await api.post<Product>('/products', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products', { replace: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = { ...data, category: data.category || undefined, location: data.location || undefined };
      const response = await api.patch<Product>(`/products/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      navigate('/products', { replace: true });
    },
  });

  const stockMutation = useMutation({
    mutationFn: async ({
      type,
      data,
    }: {
      type: MOVEMENT_TYPE.IN | MOVEMENT_TYPE.OUT;
      data: StockMovementFormData;
    }) => {
      const reason = data.reason && data.reason.trim().length > 0
        ? data.reason.trim()
        : type === MOVEMENT_TYPE.IN
        ? 'Manual stock addition'
        : 'Manual stock deduction';
      const response = await api.post(`/products/${id}/stock-movements`, {
        movementType: type,
        quantity: data.quantity,
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      setShowStockModal(null);
      resetStock();
      setStockError(null);
    },
    onError: (error: any) => {
      setStockError(
        error.response?.data?.message || 'Failed to update stock. Please try again.'
      );
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleStockAction = (data: StockMovementFormData) => {
    if (showStockModal === 'add') {
      stockMutation.mutate({ type: MOVEMENT_TYPE.IN, data });
    } else if (showStockModal === 'deduct') {
      stockMutation.mutate({ type: MOVEMENT_TYPE.OUT, data });
    }
  };

  const openStockModal = (type: 'add' | 'deduct') => {
    setShowStockModal(type);
    setStockError(null);
    resetStock({ quantity: 1, reason: '' });
  };

  const isLoading = fetchingProduct || isSubmitting;
  const serverError = createMutation.error || updateMutation.error;

  const recentMovements = productData?.stockMovements?.slice(0, 5) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/products"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Back to Products"
        >
          <FiArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiPackage className="text-blue-600" />
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEditMode ? 'Update product information and manage stock' : 'Enter product details to add to inventory'}
          </p>
        </div>
      </div>

      {fetchingProduct && isEditMode ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500">
          <FiLoader className="animate-spin text-3xl text-blue-600 mb-3" size={32} />
          <p>Loading product...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {serverError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {(serverError as any)?.response?.data?.message ||
                  'Failed to save product. Please try again.'}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Steel Hammer 12-inch"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('sku')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                    placeholder="e.g. HMR-STL-0012"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('category')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Tools, Electronics, Raw Materials"
                    list="category-list"
                  />
                  <datalist id="category-list">
                    <option value="Tools" />
                    <option value="Electronics" />
                    <option value="Raw Materials" />
                    <option value="Finished Goods" />
                    <option value="Packaging" />
                  </datalist>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unit Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('unitPrice')}
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.unitPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.unitPrice.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Warehouse Location
                  </label>
                  <input
                    type="text"
                    {...register('location')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Rack A-3, Shelf 2"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    {...register('currentStock')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="0"
                  />
                  {errors.currentStock && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentStock.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Min Stock Alert <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiAlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      {...register('minStockAlert')}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="10"
                    />
                  </div>
                  {errors.minStockAlert && (
                    <p className="mt-1 text-sm text-red-600">{errors.minStockAlert.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  <FiX size={18} />
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <FiLoader className="animate-spin" size={18} />
                  ) : (
                    <FiSave size={18} />
                  )}
                  {isLoading ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>

          {isEditMode && productData && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Current Stock</span>
                    <StockIndicator product={productData} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Min Stock Alert</span>
                    <span className="font-semibold text-slate-700">{productData.minStockAlert}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Unit Price</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(productData.unitPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Inventory Value</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(productData.currentStock * productData.unitPrice)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => openStockModal('add')}
                    className="inline-flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-green-200"
                  >
                    <FiPlus size={16} />
                    Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => openStockModal('deduct')}
                    className="inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-red-200"
                  >
                    <FiMinus size={16} />
                    Deduct Stock
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Recent Stock Movements
                </h3>
                {recentMovements.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    No stock movements recorded yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMovements.map((movement) => {
                      const mType = getMovementType(movement);
                      const isIn = mType === MOVEMENT_TYPE.IN || mType === MOVEMENT_TYPE.RETURN_IN;
                      const uName = getMovementUserName(movement);
                      return (
                        <div
                          key={movement.id}
                          className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          <div
                            className={`p-2 rounded-lg ${
                              isIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isIn ? <FiArrowDownCircle size={16} /> : <FiArrowUpCircle size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  isIn ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                }`}
                              >
                                {mType}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {isIn ? '+' : '-'}
                                {movement.quantity}
                              </span>
                            </div>
                            {movement.reason && (
                              <p className="text-sm text-slate-600 mt-1 truncate">
                                {movement.reason}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDate(movement.createdAt)}
                              {uName && ` • ${uName}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div
              className={`px-6 py-4 border-b border-slate-200 rounded-t-xl ${
                showStockModal === 'add'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                {showStockModal === 'add' ? (
                  <>
                    <FiPlus className="text-green-600" />
                    Add Stock
                  </>
                ) : (
                  <>
                    <FiMinus className="text-red-600" />
                    Deduct Stock
                  </>
                )}
              </h3>
            </div>
            <form
              onSubmit={handleStockSubmit(handleStockAction)}
              className="p-6 space-y-4"
            >
              {stockError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {stockError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  {...registerStock('quantity')}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="1"
                />
                {stockErrors.quantity && (
                  <p className="mt-1 text-sm text-red-600">
                    {stockErrors.quantity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason / Notes
                </label>
                <textarea
                  rows={3}
                  {...registerStock('reason')}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder={
                    showStockModal === 'add'
                      ? 'e.g. Purchase order #123, Return from customer'
                      : 'e.g. Sale, Damaged goods, Production use'
                  }
                />
                {stockErrors.reason && (
                  <p className="mt-1 text-sm text-red-600">{stockErrors.reason.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(null)}
                  disabled={stockSubmitting}
                  className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockSubmitting}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-70 ${
                    showStockModal === 'add'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {stockSubmitting ? (
                    <FiLoader className="animate-spin" size={16} />
                  ) : showStockModal === 'add' ? (
                    <FiPlus size={16} />
                  ) : (
                    <FiMinus size={16} />
                  )}
                  {stockSubmitting
                    ? 'Processing...'
                    : showStockModal === 'add'
                    ? 'Add Stock'
                    : 'Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StockIndicator = ({ product }: { product: Product }) => {
  const status = getStockStatus(product.currentStock, product.minStockAlert);
  let Icon = FiCheckCircle;
  if (status.status === 'low') Icon = FiAlertTriangle;
  if (status.status === 'out') Icon = FiAlertCircle;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.badgeClass}`}
      >
        <Icon size={12} />
        {status.label}
      </span>
      <span
        className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold min-w-[60px] text-center ${status.cellClass}`}
      >
        {product.currentStock}
      </span>
    </div>
  );
};

export default ProductForm;
