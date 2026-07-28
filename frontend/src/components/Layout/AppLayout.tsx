import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <Navbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
