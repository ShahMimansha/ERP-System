import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth, getRolePermissions } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import ProductDetail from './pages/products/ProductDetail';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
import CustomerDetail from './pages/customers/CustomerDetail';
import ChallanList from './pages/challans/ChallanList';
import ChallanCreate from './pages/challans/ChallanCreate';
import ChallanDetail from './pages/challans/ChallanDetail';
import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
  },
});

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const PermissionGate = ({ permission, children }: { permission: keyof ReturnType<typeof getRolePermissions>; children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const permissions = getRolePermissions(user.role);
  if (!permissions[permission]) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-500">You do not have permission to view this module.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<PermissionGate permission="dashboard"><Dashboard /></PermissionGate>} />

                <Route path="/customers" element={<PermissionGate permission="customers"><CustomerList /></PermissionGate>} />
                <Route path="/customers/new" element={<PermissionGate permission="customers"><CustomerForm /></PermissionGate>} />
                <Route path="/customers/:id" element={<PermissionGate permission="customers"><CustomerDetail /></PermissionGate>} />
                <Route path="/customers/:id/edit" element={<PermissionGate permission="customers"><CustomerForm /></PermissionGate>} />

                <Route path="/products" element={<PermissionGate permission="products"><ProductList /></PermissionGate>} />
                <Route path="/products/new" element={<PermissionGate permission="products"><ProductForm /></PermissionGate>} />
                <Route path="/products/:id" element={<PermissionGate permission="products"><ProductDetail /></PermissionGate>} />
                <Route path="/products/:id/edit" element={<PermissionGate permission="products"><ProductForm /></PermissionGate>} />

                <Route path="/challans" element={<PermissionGate permission="challans"><ChallanList /></PermissionGate>} />
                <Route path="/challans/new" element={<PermissionGate permission="challans"><ChallanCreate /></PermissionGate>} />
                <Route path="/challans/:id" element={<PermissionGate permission="challans"><ChallanDetail /></PermissionGate>} />

                <Route path="/users" element={
                  <PermissionGate permission="users">
                    <div className="p-6">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Users</h2>
                        <p className="text-slate-500">User management module.</p>
                      </div>
                    </div>
                  </PermissionGate>
                } />
                <Route path="/inventory" element={
                  <PermissionGate permission="inventory">
                    <div className="p-6">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Inventory</h2>
                        <p className="text-slate-500">Stock movements and inventory overview.</p>
                      </div>
                    </div>
                  </PermissionGate>
                } />
                <Route path="/accounts" element={
                  <PermissionGate permission="accounts">
                    <div className="p-6">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Accounts</h2>
                        <p className="text-slate-500">Accounts and finance module.</p>
                      </div>
                    </div>
                  </PermissionGate>
                } />
                <Route path="/reports" element={
                  <PermissionGate permission="reports">
                    <div className="p-6">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Reports</h2>
                        <p className="text-slate-500">Reports and analytics module.</p>
                      </div>
                    </div>
                  </PermissionGate>
                } />
                <Route path="/settings" element={
                  <PermissionGate permission="settings">
                    <div className="p-6">
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Settings</h2>
                        <p className="text-slate-500">System settings.</p>
                      </div>
                    </div>
                  </PermissionGate>
                } />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
