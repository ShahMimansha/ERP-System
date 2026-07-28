import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiUser,
  FiPackage,
  FiFileText,
  FiBox,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
} from 'react-icons/fi';
import { useAuth, getRolePermissions } from '../../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const permissions = user ? getRolePermissions(user.role) : null;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: FiHome, permission: 'dashboard' as const },
    { path: '/users', label: 'Users', icon: FiUsers, permission: 'users' as const },
    { path: '/customers', label: 'Customers', icon: FiUser, permission: 'customers' as const },
    { path: '/products', label: 'Products', icon: FiPackage, permission: 'products' as const },
    { path: '/challans', label: 'Challans', icon: FiFileText, permission: 'challans' as const },
    { path: '/inventory', label: 'Inventory', icon: FiBox, permission: 'inventory' as const },
    { path: '/accounts', label: 'Accounts', icon: FiDollarSign, permission: 'accounts' as const },
    { path: '/reports', label: 'Reports', icon: FiBarChart2, permission: 'reports' as const },
    { path: '/settings', label: 'Settings', icon: FiSettings, permission: 'settings' as const },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold">ERP System</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          if (!permissions || !permissions[item.permission]) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      {user && (
        <div className="p-4 border-t border-slate-700">
          <div className="text-sm text-slate-400">Signed in as</div>
          <div className="font-medium">{user.name}</div>
          <div className="text-xs text-slate-500">{user.role}</div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
