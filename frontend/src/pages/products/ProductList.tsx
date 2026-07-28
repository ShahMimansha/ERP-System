import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiRefreshCw,
  FiPackage,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import api from '../../api/axios';
import type { Product, PaginatedMeta, ChallanStatus as _ChallanStatus } from '../../types';
import { formatCurrency, formatDate, getStockStatus } from '../../utils/helpers';

const ProductList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const lowStock = searchParams.get('lowStock') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      if (searchInput) {
        newParams.set('search', searchInput);
      } else {
        newParams.delete('search');
      }
      newParams.set('page', '1');
      setSearchParams(newParams);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', search, category, lowStock, page, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (category) params.category = category;
      if (lowStock === 'true') params.lowStock = 'true';
      const response = await api.get('/products', { params });
      const payload = response.data.data || response.data;
      const products: Product[] = payload.data || payload.products || [];
      const meta: PaginatedMeta = {
        page: payload.page ?? 1,
        limit: payload.limit ?? 10,
        totalPages: payload.totalPages ?? Math.ceil((payload.totalResults ?? 0) / (payload.limit ?? 10)),
        totalResults: payload.totalResults ?? 0,
      };
      return { products, meta };
    },
  });

  const products = data?.products || [];
  const meta = data?.meta || { page: 1, limit: 10, totalPages: 1, totalResults: 0 };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const changePage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const changeLimit = (newLimit: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', String(newLimit));
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiPackage className="text-blue-600" />
            Products
          </h1>
          <p className="text-slate-500 mt-1">Manage your product catalog and inventory</p>
        </div>
        <Link
          to="/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FiPlus />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 bg-white min-w-[160px]"
              >
                <option value="">ALL</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Stock</label>
              <select
                value={lowStock}
                onChange={(e) => updateFilter('lowStock', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 bg-white min-w-[160px]"
              >
                <option value="">All Products</option>
                <option value="true">Low / Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="animate-pulse">
            <div className="h-12 bg-slate-100 border-b border-slate-200" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white border-b border-slate-100 px-6 flex items-center gap-4">
                <div className="h-4 w-48 bg-slate-100 rounded" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-5 w-20 bg-slate-100 rounded-full" />
                <div className="ml-auto h-8 w-8 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to load products</h3>
            <p className="text-slate-500 mb-4">Something went wrong while fetching data.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <FiRefreshCw />
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="text-slate-400">
                        <FiPackage className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium text-slate-600">No products found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or add a new product.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stockStatus = getStockStatus(product.currentStock, product.minStockAlert);
                    let StockIcon = FiCheckCircle;
                    if (stockStatus.status === 'low') StockIcon = FiAlertTriangle;
                    if (stockStatus.status === 'out') StockIcon = FiXCircle;
                    return (
                      <tr
                        key={product.id}
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">{product.sku}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 text-sm">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-700 tabular-nums">
                          {formatCurrency(product.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${stockStatus.badgeClass}`}>
                              <StockIcon size={12} />
                              {stockStatus.label}
                            </span>
                            <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold min-w-[60px] text-center tabular-nums ${stockStatus.cellClass}`}>
                              {product.currentStock}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{product.location || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Link
                              to={`/products/${product.id}`}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <FiEye size={16} />
                            </Link>
                            <Link
                              to={`/products/${product.id}/edit`}
                              className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>
                Showing <span className="font-medium text-slate-800">{products.length ? (meta.page - 1) * meta.limit + 1 : 0}</span> to{' '}
                <span className="font-medium text-slate-800">{Math.min(meta.page * meta.limit, meta.totalResults)}</span> of{' '}
                <span className="font-medium text-slate-800">{meta.totalResults}</span> results
              </span>
              <select
                value={meta.limit}
                onChange={(e) => changeLimit(parseInt(e.target.value, 10))}
                className="px-2 py-1 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 bg-white"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(meta.page - 1)}
                disabled={meta.page <= 1}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft />
                Prev
              </button>
              <div className="text-sm text-slate-600 px-2">
                Page <span className="font-medium text-slate-800">{meta.page}</span> of{' '}
                <span className="font-medium text-slate-800">{meta.totalPages || 1}</span>
              </div>
              <button
                onClick={() => changePage(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
