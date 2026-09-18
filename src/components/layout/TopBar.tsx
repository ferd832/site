import { useSupabase } from '../../hooks/useSupabase';
import { ROLE_LABELS } from '../../types';

export default function TopBar() {
  const { profile } = useSupabase();

  return (
    <header className="glass-strong rounded-2xl p-4 mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Добро пожаловать{profile?.full_name ? `, ${profile.full_name}` : ''} 👋
        </h2>
        <p className="text-sm text-purple-300/60">
          {profile?.role ? ROLE_LABELS[profile.role] : 'Загрузка...'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
          {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  );
}
