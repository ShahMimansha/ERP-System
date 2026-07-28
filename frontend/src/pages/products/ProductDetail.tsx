import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  FiPackage,
  FiArrowLeft,
  FiEdit2,
  FiLoader,
  FiAlertTriangle,
  FiAlertCircle,
  FiCheckCircle,
  FiMapPin,
  FiTag,
  FiHash,
  FiDollarSign,
  FiBox,
  FiActivity,
  FiCalendar,
  FiUser,
  FiFileText,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiRefreshCw,
  FiRepeat,
} from 'react-icons/fi';
import api from '../../api/axios';
import type { ProductWithMovements, StockMovement as StockMovementType } from '../../types';;
import { MOVEMENT_TYPE } from '../../utils/constants';
import { formatCurrency, formatDate, getStockStatus } from '../../utils/helpers';

const getMovementType = (m: StockMovementType) =>
  (m.type as string) || (m.movementType as string);
const getMovementUserName = (m: StockMovementType) =>
  m.userName || m.user?.name;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery({
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
  });

  const StatusBadge = () => {
    if (!data) return null;
    const status = getStockStatus(data.currentStock, data.minStockAlert);
    let Icon = FiCheckCircle;
    if (status.status === 'low') Icon = FiAlertTriangle;
    if (status.status === 'out') Icon = FiAlertCircle;

    return (
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${status.badgeClass}`}
        >
          <Icon size={16} />
          {status.label}
        </span>
        <span
          className={`inline-flex items-center px-4 py-2 rounded-xl text-lg font-extrabold min-w-[100px] justify-center ${status.cellClass}`}
        >
          {data.currentStock}
        </span>
      </div>
    );
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case MOVEMENT_TYPE.IN:
      case MOVEMENT_TYPE.RETURN_IN:
        return FiArrowDownCircle;
      case MOVEMENT_TYPE.OUT:
      case MOVEMENT_TYPE.RETURN_OUT:
        return FiArrowUpCircle;
      case MOVEMENT_TYPE.TRANSFER:
        return FiRepeat;
      case MOVEMENT_TYPE.ADJUSTMENT:
        return FiRefreshCw;
      default:
        return FiActivity;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case MOVEMENT_TYPE.IN:
      case MOVEMENT_TYPE.RETURN_IN:
        return {
          badge: 'bg-green-600 text-white',
          icon: 'bg-green-100 text-green-700',
          qty: 'text-green-700',
          sign: '+',
        };
      case MOVEMENT_TYPE.OUT:
      case MOVEMENT_TYPE.RETURN_OUT:
        return {
          badge: 'bg-red-600 text-white',
          icon: 'bg-red-100 text-red-700',
          qty: 'text-red-700',
          sign: '-',
        };
      case MOVEMENT_TYPE.TRANSFER:
        return {
          badge: 'bg-blue-600 text-white',
          icon: 'bg-blue-100 text-blue-700',
          qty: 'text-blue-700',
          sign: '↔',
        };
      case MOVEMENT_TYPE.ADJUSTMENT:
        return {
          badge: 'bg-purple-600 text-white',
          icon: 'bg-purple-100 text-purple-700',
          qty: 'text-purple-700',
          sign: '±',
        };
      default:
        return {
          badge: 'bg-slate-600 text-white',
          icon: 'bg-slate-100 text-slate-700',
          qty: 'text-slate-700',
          sign: '',
        };
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
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
              Product Details
            </h1>
            <p className="text-slate-500 mt-1">View product information and stock history</p>
          </div>
        </div>
        <Link
          to={`/products/${id}/edit`}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <FiEdit2 size={18} />
          Edit Product
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500">
          <FiLoader className="animate-spin text-3xl text-blue-600 mb-3" size={32} />
          <p>Loading product details...</p>
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Failed to load product
          </div>
          <p className="text-slate-500 mb-4">
            {(error as any)?.response?.data?.message || (error as Error)?.message || 'Unknown error'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{data.name}</h2>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <code className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700 text-white rounded-md text-xs font-mono">
                          <FiHash size={12} />
                          {data.sku}
                        </code>
                        {data.category && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                            <FiTag size={12} />
                            {data.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-6 space-y-5">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Product Information
                    </h3>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <FiDollarSign size={18} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Unit Price</div>
                        <div className="text-lg font-bold text-slate-800">
                          {formatCurrency(data.unitPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <FiBox size={18} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Min Stock Alert</div>
                        <div className="text-lg font-bold text-slate-800">
                          {data.minStockAlert} units
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <FiMapPin size={18} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Warehouse Location</div>
                        <div className="text-lg font-semibold text-slate-800">
                          {data.location || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5 bg-slate-50/50">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Inventory Summary
                    </h3>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <FiBox size={18} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Current Stock</div>
                        <div className="text-lg font-bold text-slate-800">
                          {data.currentStock} units
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <FiDollarSign size={18} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Total Inventory Value</div>
                        <div className="text-lg font-bold text-slate-800">
                          {formatCurrency(data.currentStock * data.unitPrice)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        <FiCalendar size={18} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Last Updated</div>
                        <div className="text-sm font-semibold text-slate-800">
                          {data.updatedAt ? formatDate(data.updatedAt) : data.createdAt ? formatDate(data.createdAt) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <FiActivity className="text-blue-600" />
                    Stock Movement Log
                  </h3>
                  <span className="text-sm text-slate-500">
                    {data.stockMovements?.length || 0} movements
                  </span>
                </div>

                {!data.stockMovements || data.stockMovements.length === 0 ? (
                  <div className="p-12 text-center">
                    <FiActivity className="mx-auto text-slate-300 mb-3" size={40} />
                    <div className="text-slate-600 font-medium mb-1">No stock movements yet</div>
                    <p className="text-slate-500 text-sm">
                      Stock additions, deductions, and adjustments will appear here
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Reason
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            User
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.stockMovements.map((movement: StockMovementType) => {
                          const mType = getMovementType(movement);
                          const Icon = getMovementIcon(mType);
                          const colors = getMovementColor(mType);
                          const uName = getMovementUserName(movement);
                          return (
                            <tr
                              key={movement.id}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <FiCalendar className="text-slate-400" size={14} />
                                  {formatDate(movement.createdAt)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-lg ${colors.icon}`}>
                                    <Icon size={14} />
                                  </div>
                                  <span
                                    className={`text-xs font-bold px-2.5 py-1 rounded ${colors.badge}`}
                                  >
                                    {mType}
                                  </span>
                                </div>
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-right font-bold text-lg ${colors.qty}`}>
                                {colors.sign}
                                {movement.quantity}
                              </td>
                              <td className="px-6 py-4">
                                {movement.reason ? (
                                  <div className="text-sm text-slate-700 flex items-start gap-2">
                                    <FiFileText className="text-slate-400 mt-0.5 flex-shrink-0" size={14} />
                                    <span>{movement.reason}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-slate-400 italic">No reason provided</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {uName ? (
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium text-xs">
                                      {String(uName).charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium">{uName}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <FiUser size={14} />
                                    System
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Health</h3>
                <StockHealthWidget product={data} />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to={`/products/${id}/edit`}
                    className="flex items-center gap-3 w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors border border-blue-200"
                  >
                    <FiEdit2 size={18} />
                    Edit Product Details
                  </Link>
                  <Link
                    to={`/products/${id}/edit`}
                    className="flex items-center gap-3 w-full p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors border border-green-200"
                  >
                    <FiArrowDownCircle size={18} />
                    Add / Deduct Stock
                  </Link>
                  <Link
                    to="/products"
                    className="flex items-center gap-3 w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200"
                  >
                    <FiArrowLeft size={18} />
                    Back to Product List
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

const StockHealthWidget = ({ product }: { product: ProductWithMovements }) => {
  const status = getStockStatus(product.currentStock, product.minStockAlert);

  const stockRatio = product.minStockAlert > 0
    ? Math.min((product.currentStock / (product.minStockAlert * 2)) * 100, 100)
    : product.currentStock > 0
    ? 100
    : 0;

  const progressColor =
    status.status === 'out'
      ? 'bg-red-500'
      : status.status === 'low'
      ? 'bg-amber-500'
      : 'bg-green-500';

  const stockShortage = product.currentStock < product.minStockAlert
    ? product.minStockAlert - product.currentStock
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Stock Level</span>
          <span className="text-sm font-bold text-slate-800">{product.currentStock} units</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} rounded-full transition-all duration-500`}
            style={{ width: `${stockRatio}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0</span>
          <span>Min Alert: {product.minStockAlert}</span>
          <span>{product.minStockAlert * 2}+</span>
        </div>
      </div>

      {stockShortage > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <FiAlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <div className="font-semibold text-amber-800">Stock Reorder Needed</div>
              <div className="text-sm text-amber-700 mt-1">
                You are <strong>{stockShortage} units</strong> below your minimum stock alert level.
              </div>
              <div className="text-xs text-amber-600 mt-2">
                Estimated reorder value:{' '}
                <strong>{formatCurrency(stockShortage * product.unitPrice)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {status.status === 'out' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
            <div>
              <div className="font-semibold text-red-800">Critical - Out of Stock!</div>
              <div className="text-sm text-red-700 mt-1">
                This product is completely out of stock and may affect pending orders.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="text-xs text-slate-500">In / Out</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-green-600 font-bold text-sm">
              {product.stockMovements?.filter(
                (m) => {
                  const t = getMovementType(m);
                  return t === MOVEMENT_TYPE.IN || t === MOVEMENT_TYPE.RETURN_IN;
                }
              ).reduce((sum, m) => sum + m.quantity, 0) || 0}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-red-600 font-bold text-sm">
              {product.stockMovements?.filter(
                (m) => {
                  const t = getMovementType(m);
                  return t === MOVEMENT_TYPE.OUT || t === MOVEMENT_TYPE.RETURN_OUT;
                }
              ).reduce((sum, m) => sum + m.quantity, 0) || 0}
            </span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="text-xs text-slate-500">Movements</div>
          <div className="text-lg font-bold text-slate-800 mt-1">
            {product.stockMovements?.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
