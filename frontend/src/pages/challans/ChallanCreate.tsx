import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiCheckCircle,
  FiArrowLeft,
  FiLoader,
  FiAlertTriangle,
  FiXCircle,
  FiPackage,
  FiUser,
} from 'react-icons/fi';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/helpers';

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  unitPrice: number;
  price?: number;
  currentStock: number;
  stock?: number;
  quantity?: number;
}

interface ProductRow {
  id: string;
  productId: string;
  unitPrice: number;
  quantity: string;
}

const ChallanCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [rows, setRows] = useState<ProductRow[]>([
    { id: crypto.randomUUID(), productId: '', unitPrice: 0, quantity: '' },
  ]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers-create'],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { limit: 200, page: 1 } });
      const payload = res.data;
      const list =
        payload?.data?.results ||
        payload?.data?.data ||
        payload?.results ||
        payload ||
        [];
      return Array.isArray(list) ? list : [];
    },
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-create'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 500, page: 1 } });
      const payload = res.data;
      const list =
        payload?.data?.data ||
        payload?.data?.results ||
        payload?.results ||
        payload ||
        [];
      return Array.isArray(list) ? list : [];
    },
  });

  const customers = (customersData as Customer[]) || [];
  const products = (productsData as Product[]) || [];

  const getCustomerContact = (c: Customer) => c.mobile ?? c.phone ?? undefined;

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (getCustomerContact(c) || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const getProduct = (productId: string): Product | undefined =>
    products.find((p) => p.id === productId);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: '', unitPrice: 0, quantity: '' },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const updateRow = (
    id: string,
    field: keyof ProductRow,
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === 'productId') {
          const pid = value as string;
          const prod = products.find((p) => p.id === pid);
          return {
            ...r,
            productId: pid,
            unitPrice: prod ? prod.unitPrice || prod.price || 0 : 0,
          };
        }
        return { ...r, [field]: value };
      })
    );
  };

  const getRowQty = (row: ProductRow): number => {
    const q = parseInt(row.quantity, 10);
    return isNaN(q) ? 0 : q;
  };

  const getRowTotal = (row: ProductRow): number => {
    return getRowQty(row) * row.unitPrice;
  };

  const totalProducts = rows.reduce((sum, r) => sum + getRowQty(r), 0);
  const totalAmount = rows.reduce((sum, r) => sum + getRowTotal(r), 0);

  const getStockInfo = (row: ProductRow) => {
    const prod = getProduct(row.productId);
    const stock = prod
      ? prod.currentStock ?? prod.stock ?? prod.quantity ?? 0
      : 0;
    const qty = getRowQty(row);
    if (!row.productId) return { status: 'empty' as const, stock, message: '' };
    if (row.quantity === '' || qty <= 0) {
      return { status: 'warn' as const, stock, message: 'Enter a valid quantity' };
    }
    if (qty > stock) {
      return {
        status: 'error' as const,
        stock,
        message: `Insufficient stock (only ${stock} available)`,
      };
    }
    return { status: 'ok' as const, stock, message: `${stock} in stock` };
  };

  const hasErrors = rows.some((r) => getStockInfo(r).status === 'error');
  const hasWarnings = rows.some((r) => getStockInfo(r).status === 'warn');
  const hasEmptyProduct = rows.some((r) => !r.productId);
  const canSubmit = !!customerId && !hasEmptyProduct && !hasErrors && !hasWarnings;

  const createMutation = useMutation({
    mutationFn: async (payload: {
      customerId: string;
      status: 'DRAFT' | 'CONFIRMED';
      items: Array<{ productId: string; quantity: number }>;
    }) => {
      const res = await api.post('/challans', payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSuccessMsg(
        variables.status === 'CONFIRMED'
          ? 'Challan confirmed successfully!'
          : 'Challan saved as draft!'
      );
      setTimeout(() => {
        navigate('/challans');
      }, 1200);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create challan';
      const details = err.response?.data?.errors;
      setErrorMsg(
        details && Array.isArray(details)
          ? `${msg}: ${details.map((e: any) => e.message || e).join(', ')}`
          : msg
      );
      setTimeout(() => setErrorMsg(null), 6000);
    },
  });

  const handleSubmit = (status: 'DRAFT' | 'CONFIRMED') => {
    if (!customerId) {
      setErrorMsg('Please select a customer');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    if (hasEmptyProduct) {
      setErrorMsg('Please select a product in all rows or remove empty rows');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    if (hasWarnings) {
      setErrorMsg('Please fix quantity warnings before submitting');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    if (hasErrors) {
      setErrorMsg('Please fix stock errors before submitting');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    const items = rows.map((r) => ({
      productId: r.productId,
      quantity: getRowQty(r),
    }));
    createMutation.mutate({ customerId, status, items });
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/challans')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium mb-3 transition-colors"
        >
          <FiArrowLeft size={16} />
          Back to Challans
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Create Sales Challan</h1>
        <p className="text-slate-500 mt-1">
          Select a customer and add products to create a new challan
        </p>
      </div>

      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-3">
          <FiCheckCircle size={20} className="shrink-0" />
          <div>
            <div className="font-semibold">{successMsg}</div>
            <div className="text-green-600 text-xs mt-0.5">Redirecting to challans list...</div>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-3">
          <FiXCircle size={20} className="shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
            <FiUser size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Step 1: Select Customer</h2>
            <p className="text-sm text-slate-500">Choose the customer for this challan</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Customer <span className="text-red-500">*</span>
          </label>
          {selectedCustomer ? (
            <div
              onClick={() => {
                setCustomerId('');
                setCustomerSearch('');
                setShowCustomerDropdown(true);
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-slate-800">{selectedCustomer.name}</div>
                {(selectedCustomer.email || getCustomerContact(selectedCustomer)) && (
                  <div className="text-xs text-slate-500">
                    {selectedCustomer.email}
                    {selectedCustomer.email && getCustomerContact(selectedCustomer) ? ' · ' : ''}
                    {getCustomerContact(selectedCustomer)}
                  </div>
                )}
              </div>
              <span className="text-xs text-blue-600 font-medium">Change</span>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder={customersLoading ? 'Loading customers...' : 'Search and select a customer...'}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                disabled={customersLoading}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
              />
              {showCustomerDropdown && !customersLoading && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">No customers found</div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onMouseDown={() => {
                          setCustomerId(c.id);
                          setCustomerSearch('');
                          setShowCustomerDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                      >
                        <div className="font-medium text-slate-800">{c.name}</div>
                        {(c.email || getCustomerContact(c)) && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {c.email}
                            {c.email && getCustomerContact(c) ? ' · ' : ''}
                            {getCustomerContact(c)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
              <FiPackage size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Step 2: Add Products</h2>
              <p className="text-sm text-slate-500">
                Add products, verify stock levels, and quantities
              </p>
            </div>
          </div>
          <button
            onClick={addRow}
            className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-slate-900 transition-colors text-sm self-start sm:self-auto"
          >
            <FiPlus size={16} />
            Add Product
          </button>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="pb-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[32%]">
                  Product
                </th>
                <th className="pb-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-[14%]">
                  Unit Price
                </th>
                <th className="pb-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">
                  Qty
                </th>
                <th className="pb-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[22%]">
                  Stock Status
                </th>
                <th className="pb-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-[14%]">
                  Line Total
                </th>
                <th className="pb-3 w-[6%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productsLoading && rows.length > 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <FiLoader className="animate-spin" />
                      Loading products...
                    </div>
                  </td>
                </tr>
              )}
              {!productsLoading &&
                rows.map((row, idx) => {
                  const stockInfo = getStockInfo(row);
                  return (
                    <tr key={row.id} className="group">
                      <td className="py-4 pr-3">
                        <select
                          value={row.productId}
                          onChange={(e) => updateRow(row.id, 'productId', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-white text-slate-800"
                        >
                          <option value="">-- Select product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {p.sku ? ` (${p.sku})` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 pl-3 pr-2 text-right">
                        <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 tabular-nums">
                          {formatCurrency(row.unitPrice)}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all text-sm text-center tabular-nums ${
                            stockInfo.status === 'error'
                              ? 'border-red-400 focus:ring-red-500 bg-red-50 text-red-800'
                              : stockInfo.status === 'warn'
                              ? 'border-amber-400 focus:ring-amber-500 bg-amber-50 text-amber-800'
                              : 'border-slate-300 focus:ring-blue-500 text-slate-800'
                          }`}
                        />
                      </td>
                      <td className="py-4 px-2">
                        {stockInfo.status === 'empty' && row.productId === '' ? (
                          <span className="text-xs text-slate-400 italic">—</span>
                        ) : (
                          <div>
                            <div
                              className={`flex items-center gap-1.5 text-xs font-semibold ${
                                stockInfo.status === 'error'
                                  ? 'text-red-700'
                                  : stockInfo.status === 'warn'
                                  ? 'text-amber-700'
                                  : 'text-green-700'
                              }`}
                            >
                              {stockInfo.status === 'error' ? (
                                <FiXCircle size={14} className="shrink-0" />
                              ) : stockInfo.status === 'warn' ? (
                                <FiAlertTriangle size={14} className="shrink-0" />
                              ) : (
                                <FiCheckCircle size={14} className="shrink-0" />
                              )}
                              {stockInfo.message}
                            </div>
                            {row.productId && (
                              <div className="text-xs text-slate-500 mt-1 ml-5">
                                Row {idx + 1}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 pl-2 pr-3 text-right">
                        <div className="px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm font-bold text-blue-800 tabular-nums">
                          {formatCurrency(getRowTotal(row))}
                        </div>
                      </td>
                      <td className="py-4 pl-2 text-right">
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 1}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          title="Remove row"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {hasErrors && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FiXCircle size={22} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-800">Stock Errors Detected</div>
                  <div className="text-sm text-red-700 mt-1">
                    One or more products have insufficient stock. Please reduce quantities or
                    remove items before confirming.
                  </div>
                </div>
              </div>
            </div>
          )}
          {!hasErrors && hasWarnings && (
            <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FiAlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-800">Quantity Warnings</div>
                  <div className="text-sm text-amber-700 mt-1">
                    Some rows have missing or invalid quantities. Please review before submitting.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-xl p-6 text-white">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
              Challan Summary
            </h3>
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Product Rows</span>
                <span className="font-medium">{rows.filter((r) => r.productId).length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Quantity</span>
                <span className="font-medium tabular-nums">{totalProducts}</span>
              </div>
              <div className="h-px bg-slate-700 my-3"></div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Total Amount</span>
                <span className="text-2xl font-bold tabular-nums text-emerald-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => handleSubmit('DRAFT')}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium border border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <FiSave size={18} />
                )}
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit('CONFIRMED')}
                disabled={isSubmitting || !canSubmit}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold shadow-lg shadow-emerald-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
              >
                {isSubmitting ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <FiCheckCircle size={18} />
                )}
                Confirm Challan
              </button>
            </div>
            {!customerId && (
              <p className="text-xs text-slate-400 mt-3 text-center">
                Select a customer to enable confirmation
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanCreate;
