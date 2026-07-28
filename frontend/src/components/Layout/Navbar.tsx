import { FiBell, FiLogOut, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-slate-800">
          Welcome, {user?.name}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative">
          <FiBell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0).toUpperCase() || <FiUser size={18} />}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-800">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Logout"
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
