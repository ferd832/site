import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="stars-bg" />
      <Sidebar />
      <main className="flex-1 p-8 ml-64 relative z-10">
        <TopBar />
        <Outlet />
      </main>
    </div>
  );
}
