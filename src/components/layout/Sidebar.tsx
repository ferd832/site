import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const menuItems = [
  { path: '/dashboard', label: 'Дашборд', icon: '📊' },
  { path: '/releases', label: 'Релизы', icon: '💿' },
  { path: '/tracks', label: 'Треки', icon: '🎵' },
  { path: '/artists', label: 'Артисты', icon: '🎤' },
  { path: '/lyrics', label: 'Тексты (TTML)', icon: '📝' },
  { path: '/tasks', label: 'Задачи', icon: '✅' },
  { path: '/profile', label: 'Профиль', icon: '👤' },
];

export default function Sidebar() {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 glass-strong min-h-screen p-4 flex flex-col fixed left-0 top-0 bottom-0 z-20">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 animate-spin-slow" />
        <div>
          <h1 className="text-lg font-bold cosmic-text">PLANET MUSIC</h1>
          <p className="text-xs text-purple-300/60">Label Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30'
                  : 'text-purple-200/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2.5 rounded-xl text-sm text-purple-200/70 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
      >
        <span>🚪</span>
        <span>Выйти</span>
      </button>
    </aside>
  );
}
