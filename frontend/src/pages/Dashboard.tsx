import { useQuery } from '@tanstack/react-query';
import {
  FiUsers,
  FiUserCheck,
  FiPackage,
  FiAlertTriangle,
  FiFileText,
  FiTrendingUp,
  FiLoader,
} from 'react-icons/fi';
import api from '../api/axios';

const statusBadgeColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800';
    case 'LEAD':
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-800';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const Dashboard = () => {
  const { data: totalCustomers, isLoading: loadingTotalCustomers } = useQuery({
    queryKey: ['dashboard', 'customers', 'total'],
    queryFn: async () => {
      const res = await api.get('/customers?limit=1');
      return res.data?.data?.totalResults ?? 0;
    },
  });

  const { data: activeCustomers, isLoading: loadingActiveCustomers } = useQuery({
    queryKey: ['dashboard', 'customers', 'active'],
    queryFn: async () => {
      const res = await api.get('/customers?status=ACTIVE&limit=1');
      return res.data?.data?.totalResults ?? 0;
    },
  });

  const { data: totalProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['dashboard', 'products', 'total'],
    queryFn: async () => {
      const res = await api.get('/products?limit=1');
      return res.data?.data?.totalResults ?? 0;
    },
  });

  const { data: lowStockProducts, isLoading: loadingLowStock } = useQuery({
    queryKey: ['dashboard', 'products', 'low-stock'],
    queryFn: async () => {
      const res = await api.get('/products?lowStock=true&limit=1');
      return res.data?.data?.totalResults ?? 0;
    },
  });

  const { data: totalChallans, isLoading: loadingChallans } = useQuery({
    queryKey: ['dashboard', 'challans', 'total'],
    queryFn: async () => {
      const res = await api.get('/challans?limit=1');
      return res.data?.data?.totalResults ?? 0;
    },
  });

  const { data: recentChallans, isLoading: loadingRecentChallans } = useQuery({
    queryKey: ['dashboard', 'challans', 'recent'],
    queryFn: async () => {
      const res = await api.get('/challans?limit=5');
      const payload = res.data?.data;
      return payload?.results || payload?.data || payload?.challans || [];
    },
  });

  const statCards = [
    {
      label: 'Total Customers',
      value: loadingTotalCustomers ? null : totalCustomers,
      icon: FiUsers,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Active Customers',
      value: loadingActiveCustomers ? null : activeCustomers,
      icon: FiUserCheck,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Products',
      value: loadingProducts ? null : totalProducts,
      icon: FiPackage,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Low Stock Products',
      value: loadingLowStock ? null : lowStockProducts,
      icon: FiAlertTriangle,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Total Challans',
      value: loadingChallans ? null : totalChallans,
      icon: FiFileText,
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
            <p className="text-blue-100 text-lg">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <FiTrendingUp size={40} className="text-white/80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {card.value === null ? (
                      <FiLoader className="animate-spin text-slate-300" size={22} />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={card.iconColor} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Recent Challans</h2>
            <p className="text-sm text-slate-500">Latest 5 challans</p>
          </div>
        </div>

        {loadingRecentChallans ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <FiLoader className="animate-spin mr-2" />
            Loading...
          </div>
        ) : !recentChallans || recentChallans.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No challans yet</div>
        ) : (
          <div className="space-y-4">
            {recentChallans.map((challan: any) => (
              <div
                key={challan.id}
                className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-slate-800">
                      {challan.challanNumber}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeColor(
                        challan.status
                      )}`}
                    >
                      {challan.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {challan.customer?.name || challan.customerName || 'Unknown customer'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(challan.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;