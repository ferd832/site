import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../context/I18nContext';
import { ROLE_LABELS } from '../types';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { profile, updateProfile, releases, tasks } = useData();
  const { t, lang } = useI18n();
  const [fullName, setFullName] = useState(profile.fullName || '');
  const [position, setPosition] = useState(profile.position || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ fullName, position: position || undefined });
    toast.success(t('Profile updated', 'Профиль обновлён'));
  };

  const completedTasks = tasks.filter(t => t.isCompleted).length;

  return (
    <div className="space-y-6 max-w-3xl animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold cosmic-text">{t('Profile', 'Профиль')}</h2>
        <p className="text-sm text-purple-300/50 mt-1">{t('Manage your account', 'Управление аккаунтом')}</p>
      </div>

      <div className="glass-card p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl text-white font-bold shadow-2xl shadow-purple-500/20">
            {profile.fullName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-bold text-white">{profile.fullName || t('No name', 'Без имени')}</h3>
            <p className="text-purple-300/60 mt-1">{profile.position || ROLE_LABELS[profile.role][lang]}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {ROLE_LABELS[profile.role][lang]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-2xl font-bold text-white">{releases.length}</p>
            <p className="text-xs text-purple-300/50 mt-1">{t('Releases', 'Отгрузки')}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-2xl font-bold text-white">{completedTasks}</p>
            <p className="text-xs text-purple-300/50 mt-1">{t('Completed', 'Выполнено')}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-2xl font-bold text-white">{tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%</p>
            <p className="text-xs text-purple-300/50 mt-1">{t('Progress', 'Прогресс')}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Full Name', 'Полное имя')}</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="cosmic-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Position', 'Должность')}</label>
            <input type="text" value={position} onChange={e => setPosition(e.target.value)} className="cosmic-input" />
          </div>
          <button type="submit" className="cosmic-btn cosmic-btn-primary">{t('Save Changes', 'Сохранить изменения')}</button>
        </form>
      </div>
    </div>
  );
}
