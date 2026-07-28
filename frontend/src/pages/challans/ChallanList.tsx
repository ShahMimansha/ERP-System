import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiFileText,
  FiPlus,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiEye,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiBox,
  FiXCircle,
} from 'react-icons/fi';
import api from '../../api/axios';
import type { Challan } from '../../types';
import { CHALLAN_STATUS } from '../../utils/constants';
import { formatDate, getChallanStatusBadgeClasses, getChallanStatusDotClasses, getChallanStatusLabel } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

interface ListChallan {
  id: string;
  challanNumber: number;
  customerId: string;
  customerName?: string;
  totalQuantity: number;
  itemsCount?: number;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  createdByName?: string;
}

const ChallanList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const status = searchParams.get('status') || '';
  const customerId = searchParams.get('customerId') || '';
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [showFilters, setShowFilters] = useState(!!status || !!customerId);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateParams = (updates: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === '' || val === null) {
        next.delete(key);
      } else {
        next.set(key, String(val));
      }
    });
    if (!next.get('page') && updates.page !== undefined && updates.page !== 1) {
      next.set('page', String(updates.page));
    }
    setSearchParams(next);
  };

  let debounceTimer: NodeJS.Timeout;
  const onSearchChange = (val: string) => {
    setSearchInput(val);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateParams({ search: val || undefined, page: 1 });
    }, 300);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['challans', { page, limit, status, customerId, search }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (status) params.status = status;
      if (customerId) params.customerId = customerId;
      if (search) params.search = search;
      const res = await api.get('/challans', { params });
      const payload = res.data?.data;
      const list = payload?.data || payload?.results || res.data?.results || [];
      const pageInfo = {
        page: payload?.page ?? 1,
        limit: payload?.limit ?? limit,
        totalPages: payload?.totalPages ?? 1,
        totalResults: payload?.totalResults ?? list.length,
      };
      return { list, pageInfo };
    },
  });

  const list: ListChallan[] = (data?.list as ListChallan[]) || [];
  const pageInfo = data?.pageInfo || { page, limit, totalPages: 1, totalResults: list.length };

  const { can } = useAuth();
  const canCreate = can?.createChallan ?? true;
  const canConfirm = can?.confirmChallan ?? true;
  const canCancel = can?.cancelChallan ?? !!user;

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/challans/${id}/confirm`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/challans/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: CHALLAN_STATUS.DRAFT, label: 'Draft' },
    { value: CHALLAN_STATUS.CONFIRMED, label: 'Confirmed' },
    { value: CHALLAN_STATUS.CANCELLED, label: 'Cancelled' },
  ];

  const totalItemsQty = useMemo(
    () => list.reduce((s, c) => s + (c.totalQuantity || 0), 0),
    [list]
  );

  const clearFilters = () => {
    setSearchInput('');
    updateParams({ status: undefined, customerId: undefined, search: undefined, page: 1 });
  };

  const startIndex = (pageInfo.page - 1) * pageInfo.limit + 1;
  const endIndex = Math.min(pageInfo.page * pageInfo.limit, pageInfo.totalResults);
  const hasFilters = status || customerId || search;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiFileText className="text-indigo-600" />
            Sales Challans
          </h1>
          <p className="text-slate-500 mt-1">
            Manage challans, track deliveries and confirm orders
          </p>
        </div>
        {canCreate && (
          <Link
            to="/challans/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <FiPlus size={18} />
            New Challan
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Challans"
          value={pageInfo.totalResults}
          icon={<FiFileText className="text-indigo-500" />}
          bg="bg-indigo-50 border-indigo-100"
        />
        <StatCard
          label="Total Qty Delivered"
          value={totalItemsQty}
          icon={<FiBox className="text-emerald-500" />}
          bg="bg-emerald-50 border-emerald-100"
        />
        <StatCard
          label="Drafts"
          value={list.filter((c) => c.status === CHALLAN_STATUS.DRAFT).length || (pageInfo.page === 1 && !hasFilters ? 0 : '—')}
          icon={<FiFileText className="text-amber-500" />}
          bg="bg-amber-50 border-amber-100"
        />
        <StatCard
          label="Confirmed (Page)"
          value={list.filter((c) => c.status === CHALLAN_STATUS.CONFIRMED).length}
          icon={<FiCheckCircle className="text-green-500" />}
          bg="bg-green-50 border-green-100"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by challan number..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || hasFilters
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <FiFilter size={16} />
              Filters
              {hasFilters && (
                <span className="ml-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] leading-5 text-center">
                  {[status, customerId, search].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <FiX size={14} />
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <FiRefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => updateParams({ status: e.target.value || undefined, page: 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Customer ID
              </label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => updateParams({ customerId: e.target.value || undefined, page: 1 })}
                placeholder="Enter customer ID (optional)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Results per page
              </label>
              <select
                value={String(limit)}
                onChange={(e) => updateParams({ limit: e.target.value, page: 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} per page
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <FiLoader className="animate-spin text-3xl text-indigo-600 mb-3" size={32} />
            <p>Loading challans...</p>
          </div>
        ) : isError ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <FiAlertTriangle size={28} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">Failed to load challans</h3>
            <p className="text-slate-500 mb-4 text-sm">An error occurred. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <FiRefreshCw size={14} />
              Try Again
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FiFileText size={36} className="text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">No challans found</h3>
            <p className="text-slate-500 mb-5 max-w-md text-sm">
              {hasFilters
                ? 'No challans match your current filters. Try clearing filters or search differently.'
                : "You haven't created any challans yet. Create your first challan to get started."}
            </p>
            {canCreate && !hasFilters && (
              <Link
                to="/challans/new"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <FiPlus size={16} />
                Create First Challan
              </Link>
            )}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
              >
                <FiX size={16} />
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Challan #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Total Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      By
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/challans/${c.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-800 text-sm">#{c.challanNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(c.customerName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 text-sm truncate">
                              {c.customerName || <span className="text-slate-400 italic">Unknown customer</span>}
                            </div>
                            {c.customerId && (
                              <div className="text-xs text-slate-400 font-mono truncate">{c.customerId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getChallanStatusBadgeClasses(
                            c.status
                          )}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${getChallanStatusDotClasses(c.status)}`} />
                          {getChallanStatusLabel(c.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-700 tabular-nums">
                        {c.itemsCount ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-slate-800 tabular-nums">
                        {c.totalQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <FiCalendar className="text-slate-400" size={14} />
                          {formatDate(c.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <FiUser className="text-slate-400" size={14} />
                          <span className="truncate max-w-[120px]">
                            {c.createdByName || <span className="text-slate-400 italic">System</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigate(`/challans/${c.id}`)}
                            className="p-2 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Challan"
                          >
                            <FiEye size={16} />
                          </button>
                          {canConfirm && c.status === CHALLAN_STATUS.DRAFT && (
                            <button
                              type="button"
                              disabled={confirmMutation.isPending}
                              onClick={() => confirmMutation.mutate(c.id)}
                              className="p-2 text-slate-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Confirm Challan"
                            >
                              {confirmMutation.variables === c.id && confirmMutation.isPending ? (
                                <FiLoader className="animate-spin text-green-600" size={16} />
                              ) : (
                                <FiCheckCircle size={16} />
                              )}
                            </button>
                          )}
                          {canCancel && c.status !== CHALLAN_STATUS.CANCELLED && (
                            <button
                              type="button"
                              disabled={cancelMutation.isPending}
                              onClick={() => {
                                if (confirm(`Are you sure you want to cancel challan #${c.challanNumber}?`)) {
                                  cancelMutation.mutate(c.id);
                                }
                              }}
                              className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancel Challan"
                            >
                              {cancelMutation.variables === c.id && cancelMutation.isPending ? (
                                <FiLoader className="animate-spin text-red-600" size={16} />
                              ) : (
                                <FiXCircle size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageInfo.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-slate-600">
                  Showing <span className="font-semibold text-slate-800">{startIndex}</span>
                  {'–'}
                  <span className="font-semibold text-slate-800">{endIndex}</span> of{' '}
                  <span className="font-semibold text-slate-800">{pageInfo.totalResults}</span> challans
                </div>
                <div className="flex items-center gap-1.5 self-center sm:self-auto">
                  <button
                    onClick={() => updateParams({ page: Math.max(1, pageInfo.page - 1) })}
                    disabled={pageInfo.page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiChevronLeft size={14} />
                    Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pageInfo.totalPages) }, (_, i) => {
                      let p: number;
                      const total = pageInfo.totalPages;
                      const current = pageInfo.page;
                      if (total <= 5) {
                        p = i + 1;
                      } else if (current <= 3) {
                        p = i + 1;
                      } else if (current >= total - 2) {
                        p = total - 4 + i;
                      } else {
                        p = current - 2 + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => updateParams({ page: p })}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            p === current
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-700 hover:bg-white hover:border hover:border-slate-300 bg-transparent'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => updateParams({ page: Math.min(pageInfo.totalPages, pageInfo.page + 1) })}
                    disabled={pageInfo.page >= pageInfo.totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  icon,
  bg,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bg: string;
}) => (
  <div className={`rounded-xl border p-5 ${bg} transition-all hover:shadow-sm`}>
    <div className="flex items-start justify-between">
      <div>
        <div className="text-sm font-medium text-slate-600 mb-1">{label}</div>
        <div className="text-2xl font-bold text-slate-800 tabular-nums">{value}</div>
      </div>
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
    </div>
  </div>
);

export default ChallanList;
