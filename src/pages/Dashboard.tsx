import { useData } from '../context/DataContext';
import { useI18n } from '../context/I18nContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { releases, artists } = useData();
  const { t } = useI18n();
  const hasData = releases.length > 0 || artists.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-8 animate-slide-up">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 animate-spin-slow opacity-80" />
          <h2 className="text-3xl font-bold cosmic-text mb-3">{t('Welcome to PLANET MUSIC', 'Добро пожаловать в PLANET MUSIC')}</h2>
          <p className="text-purple-300/60 max-w-md mx-auto">{t('Your label management dashboard. Start by adding your first release.', 'Ваш кабинет управления лейблом. Начните с добавления первой отгрузки.')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Link to="/releases" className="glass-card p-6 text-center hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">{t('New Release', 'Новая отгрузка')}</h3>
            <p className="text-sm text-purple-300/50">{t('Ship a single, EP or album', 'Отгрузить сингл, EP или альбом')}</p>
          </Link>
          <Link to="/artists" className="glass-card p-6 text-center hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">{t('Add Artist', 'Добавить исполнителя')}</h3>
            <p className="text-sm text-purple-300/50">{t('Create artist profile', 'Создать профиль исполнителя')}</p>
          </Link>
          <Link to="/lyrics" className="glass-card p-6 text-center hover:scale-105 transition-transform">
            <h3 className="text-lg font-semibold text-white mb-2">{t('Lyrics Studio', 'Студия текстов')}</h3>
            <p className="text-sm text-purple-300/50">{t('Sync lyrics with audio', 'Синхронизировать текст с аудио')}</p>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
          <p className="text-3xl font-bold text-white">{releases.length}</p>
          <p className="text-sm text-purple-200/60 mt-1">{t('Releases', 'Отгрузки')}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20">
          <p className="text-3xl font-bold text-white">{artists.length}</p>
          <p className="text-sm text-purple-200/60 mt-1">{t('Artists', 'Исполнители')}</p>
        </div>

      </div>
    </div>
  );
}
