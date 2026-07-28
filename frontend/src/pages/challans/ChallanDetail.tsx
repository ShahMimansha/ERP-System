import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCheck,
  FiX,
  FiLoader,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiUser,
  FiCalendar,
  FiClock,
  FiXCircle,
} from 'react-icons/fi';
import api from '../../api/axios';
import { ChallanStatus } from '../../types';
import type { ChallanItem } from '../../types';
import { getChallanStatusBadgeClasses, getChallanStatusDotClasses, getChallanStatusLabel, formatCurrency, formatDate } from '../../utils/helpers';

interface BackendChallan {
  id: string;
  challanNumber: string | number;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email?: string | null;
    mobile?: string | null;
  } | null;
  customerName?: string;
  createdByName?: string;
  items?: ChallanItem[];
}

const ChallanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: challan,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['challans', id],
    queryFn: async () => {
      const res = await api.get(`/challans/${id}`);
      return res.data?.data?.challan as BackendChallan | undefined;
    },
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/challans/${id}/confirm`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['challans', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSuccessMsg('Challan confirmed successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      refetch();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to confirm challan');
      setTimeout(() => setErrorMsg(null), 5000);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/challans/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['challans', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSuccessMsg('Challan cancelled successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      refetch();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel challan');
      setTimeout(() => setErrorMsg(null), 5000);
    },
  });

  const c = challan;
  const items: ChallanItem[] = c?.items || [];

  const totalQty =
    c?.totalQuantity ?? items.reduce((s, i) => s + (i.quantity || 0), 0);

  const itemsTotal = items.reduce((sum, i) => {
    const price = Number(i.productSnapshotPrice ?? 0);
    return sum + (price * (i.quantity || 0));
  }, 0);

  const customerName =
    c?.customer?.name || c?.customerName || '—';
  const customerEmail = c?.customer?.email || undefined;
  const customerMobile = c?.customer?.mobile || undefined;

  const createdByName = c?.createdByName || '—';

  const stockWarnings: Array<{ name: string; message: string }> = [];
  items.forEach((item) => {
    const currentStock = item.product?.currentStock;
    if (currentStock !== undefined && currentStock !== null && item.quantity > currentStock) {
      stockWarnings.push({
        name: item.productSnapshotName || item.product?.name || 'Unknown product',
        message: `Requested ${item.quantity} but only ${currentStock} available now`,
      });
    }
  });

  const uniqueWarnings = stockWarnings.filter(
    (w, i, arr) => arr.findIndex((x) => x.name === w.name) === i
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          to="/challans"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 text-sm font-medium mb-3 transition-colors"
        >
          <FiArrowLeft size={16} />
          Back to Challans
        </Link>
        {isLoading ? (
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        ) : c ? (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">
                  Challan #{c.challanNumber}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getChallanStatusBadgeClasses(
                    c.status
                  )}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${getChallanStatusDotClasses(
                      c.status
                    )}`}
                  />
                  {getChallanStatusLabel(c.status)}
                </span>
              </div>
              <p className="text-slate-500 mt-1">
                Created on {formatDate(c.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {c.status === ChallanStatus.DRAFT && (
                <button
                  onClick={() => confirmMutation.mutate()}
                  disabled={confirmMutation.isPending}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirmMutation.isPending ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiCheck size={16} />
                  )}
                  Confirm Challan
                </button>
              )}
              {c.status !== ChallanStatus.CANCELLED && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to cancel challan #${c.challanNumber}?`)) {
                      cancelMutation.mutate();
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="inline-flex items-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelMutation.isPending ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiX size={16} />
                  )}
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-3">
          <FiCheckCircle size={20} className="shrink-0" />
          <div className="font-semibold">{successMsg}</div>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-3">
          <FiXCircle size={20} className="shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {uniqueWarnings.length > 0 && c?.status !== ChallanStatus.CANCELLED && (
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FiAlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-amber-800">
                Stock Availability Warning
              </div>
              <div className="text-sm text-amber-700 mt-1">
                The following items may have insufficient stock now:
              </div>
              <ul className="mt-2 space-y-1">
                {uniqueWarnings.map((w, i) => (
                  <li
                    key={i}
                    className="text-sm text-amber-800 flex items-start gap-2"
                  >
                    <span className="font-medium">{w.name}:</span>
                    <span>{w.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-2" />
                  <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-slate-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : isError || !c ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFileText size={28} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            Challan not found
          </h3>
          <p className="text-slate-500 mb-4">
            The challan you're looking for doesn't exist or could not be loaded.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FiFileText size={18} className="text-slate-500" />
                  Items ({items.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Snapshot Price
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Line Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No items in this challan
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const price = Number(item.productSnapshotPrice ?? 0);
                        const qty = item.quantity ?? 0;
                        const lineTotal = price * qty;
                        const productName =
                          item.productSnapshotName ||
                          item.product?.name ||
                          'Unknown';
                        return (
                          <tr
                            key={item.id || item.productId}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-800">
                                {productName}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {item.product?.sku && (
                                  <>SKU: <span className="font-mono">{item.product.sku}</span></>
                                )}
                                {!item.product?.sku && <>ID: {item.productId}</>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-slate-700 tabular-nums font-medium">
                              {formatCurrency(price)}
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-slate-700 tabular-nums font-medium">
                              {qty}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 tabular-nums">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white">
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 text-right text-sm font-semibold text-slate-300"
                      >
                        Totals
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold tabular-nums">
                        {totalQty}
                      </td>
                      <td className="px-6 py-4 text-right text-lg font-bold tabular-nums text-emerald-400">
                        {formatCurrency(itemsTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FiUser size={18} className="text-slate-500" />
                  Customer
                </h2>
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-lg mb-3">
                  {String(customerName).charAt(0).toUpperCase()}
                </div>
                <div className="font-semibold text-slate-800 text-lg">
                  {customerName}
                </div>
                {customerEmail && (
                  <div className="text-sm text-slate-500 mt-1">{customerEmail}</div>
                )}
                {customerMobile && (
                  <div className="text-sm text-slate-500 mt-0.5">{customerMobile}</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FiCalendar size={18} className="text-slate-500" />
                  Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
                    Challan Date
                  </div>
                  <div className="text-sm text-slate-800 font-medium flex items-center gap-2">
                    <FiClock size={14} className="text-slate-400" />
                    {new Date(c.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
                    Created By
                  </div>
                  <div className="text-sm text-slate-800 font-medium">
                    {createdByName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
                    Created At
                  </div>
                  <div className="text-sm text-slate-600">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">
                    Last Updated
                  </div>
                  <div className="text-sm text-slate-600">
                    {new Date(c.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallanDetail;
