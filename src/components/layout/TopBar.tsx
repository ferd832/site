import { useData } from '../../context/DataContext';
import { useI18n } from '../../context/I18nContext';
import { ROLE_LABELS } from '../../types';

export default function TopBar() {
  const { profile } = useData();
  const { t, lang } = useI18n();

  return (
    <header className="glass-strong rounded-2xl p-4 lg:p-5 mb-6 flex items-center justify-between">
      <div>
        <p className="text-xs text-purple-300/50">
          {profile.position || ROLE_LABELS[profile.role][lang]}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
          {profile.fullName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  );
}
