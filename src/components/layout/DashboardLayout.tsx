import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex relative z-10">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <TopBar />
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
