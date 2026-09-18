import { Link, useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useI18n } from '../../context/I18nContext';
import { useState } from 'react';

export default function Sidebar() {
  const location = useLocation();
  const { logout, tasks } = useData();
  const { t, lang, setLang } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeTasks = tasks.filter(t => !t.isCompleted).length;

  const menuItems = [
    { path: '/dashboard', label: t('Dashboard', 'Главная') },
    { path: '/releases', label: t('Releases', 'Отгрузки') },
    { path: '/artists', label: t('Artists', 'Исполнители') },
    { path: '/lyrics', label: t('Lyrics Studio', 'Студия текстов') },
    { path: '/tasks', label: t('Tasks', 'Задачи') },
    { path: '/profile', label: t('Profile', 'Профиль') },
  ];

  const sidebarContent = (
    <>
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 animate-spin-slow" />
        <div>
          <h1 className="text-base font-bold cosmic-text">PLANET MUSIC</h1>
          <p className="text-[10px] text-purple-300/50 uppercase tracking-wider">{t('Label Dashboard', 'Кабинет лейбла')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                isActive ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 text-white border border-purple-500/30' : 'text-purple-200/60 hover:text-white hover:bg-white/5'
              }`}>
              <span className="font-medium">{item.label}</span>
              {item.path === '/tasks' && activeTasks > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">{activeTasks}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-2">
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          <button onClick={() => setLang('en')} className={`flex-1 px-3 py-2 text-xs ${lang === 'en' ? 'bg-purple-500/20 text-white' : 'text-purple-300/60'}`}>EN</button>
          <button onClick={() => setLang('ru')} className={`flex-1 px-3 py-2 text-xs ${lang === 'ru' ? 'bg-purple-500/20 text-white' : 'text-purple-300/60'}`}>RU</button>
        </div>
        <button onClick={logout} className="w-full px-4 py-3 rounded-xl text-sm text-purple-200/60 hover:text-white hover:bg-white/5 transition-all">
          {t('Sign Out', 'Выйти')}
        </button>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl glass-strong flex items-center justify-center text-white">
        {mobileOpen ? '✕' : '☰'}
      </button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 glass-strong fixed left-0 top-0 bottom-0 z-30 p-4">{sidebarContent}</aside>
      <aside className={`lg:hidden flex flex-col w-64 glass-strong fixed top-0 bottom-0 z-50 p-4 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebarContent}</aside>
    </>
  );
}
