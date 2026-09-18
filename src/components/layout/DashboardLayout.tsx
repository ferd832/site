import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import StarField from '../ttml/StarField';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex relative z-10">
      <StarField />
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 relative z-10">
        <TopBar />
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
