import { CustomerStatus, CustomerType, ChallanStatus } from '../types';

export const getStatusBadgeClasses = (status: CustomerStatus): string => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case CustomerStatus.ACTIVE:
      return `${base} bg-green-100 text-green-800`;
    case CustomerStatus.LEAD:
      return `${base} bg-blue-100 text-blue-800`;
    case CustomerStatus.INACTIVE:
      return `${base} bg-slate-100 text-slate-800`;
    default:
      return `${base} bg-slate-100 text-slate-800`;
  }
};

export const getStatusLabel = (status: CustomerStatus): string => {
  switch (status) {
    case CustomerStatus.ACTIVE:
      return 'Active';
    case CustomerStatus.LEAD:
      return 'Lead';
    case CustomerStatus.INACTIVE:
      return 'Inactive';
    default:
      return status;
  }
};

export const getTypeBadgeClasses = (type: CustomerType): string => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (type) {
    case CustomerType.RETAIL:
      return `${base} bg-purple-100 text-purple-800`;
    case CustomerType.WHOLESALE:
      return `${base} bg-orange-100 text-orange-800`;
    case CustomerType.DISTRIBUTOR:
      return `${base} bg-indigo-100 text-indigo-800`;
    default:
      return `${base} bg-slate-100 text-slate-800`;
  }
};

export const getTypeLabel = (type: CustomerType): string => {
  switch (type) {
    case CustomerType.RETAIL:
      return 'Retail';
    case CustomerType.WHOLESALE:
      return 'Wholesale';
    case CustomerType.DISTRIBUTOR:
      return 'Distributor';
    default:
      return type;
  }
};

export const getChallanStatusBadgeClasses = (status: ChallanStatus): string => {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold';
  switch (status) {
    case ChallanStatus.DRAFT:
      return `${base} bg-yellow-100 text-yellow-800 border border-yellow-300`;
    case ChallanStatus.CONFIRMED:
      return `${base} bg-green-100 text-green-800 border border-green-300`;
    case ChallanStatus.CANCELLED:
      return `${base} bg-red-100 text-red-800 border border-red-300`;
    default:
      return `${base} bg-slate-100 text-slate-800 border border-slate-300`;
  }
};

export const getChallanStatusDotClasses = (status: ChallanStatus): string => {
  switch (status) {
    case ChallanStatus.DRAFT:
      return 'bg-yellow-500';
    case ChallanStatus.CONFIRMED:
      return 'bg-green-500';
    case ChallanStatus.CANCELLED:
      return 'bg-red-500';
    default:
      return 'bg-slate-500';
  }
};

export const getChallanStatusLabel = (status: ChallanStatus): string => {
  switch (status) {
    case ChallanStatus.DRAFT:
      return 'Draft';
    case ChallanStatus.CONFIRMED:
      return 'Confirmed';
    case ChallanStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
};

export interface StockStatus {
  status: 'ok' | 'low' | 'out';
  label: string;
  badgeClass: string;
  cellClass: string;
}

export const getStockStatus = (currentStock: number, minStockAlert: number): StockStatus => {
  if (currentStock <= 0) {
    return {
      status: 'out',
      label: 'Out of Stock',
      badgeClass: 'bg-red-100 text-red-800',
      cellClass: 'bg-red-100 text-red-800',
    };
  }
  if (currentStock <= minStockAlert) {
    return {
      status: 'low',
      label: 'Low Stock',
      badgeClass: 'bg-amber-100 text-amber-800',
      cellClass: 'bg-amber-100 text-amber-800',
    };
  }
  return {
    status: 'ok',
    label: 'In Stock',
    badgeClass: 'bg-green-100 text-green-800',
    cellClass: 'bg-green-50 text-green-800',
  };
};

export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') return '₹0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

export const formatDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export const isDatePast = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  } catch {
    return false;
  }
};

export const formatDateForInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

export const formatNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-IN');
};
