import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useSupabase } from '../hooks/useSupabase';
import { ROLE_LABELS } from '../types';
import type { UserRole } from '../types';

export default function ProfilePage() {
  const { profile, user } = useSupabase();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [position, setPosition] = useState(profile?.position || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPosition(profile.position || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      position: position || undefined,
    }).eq('id', user?.id);
    
    if (error) setMessage('Ошибка: ' + error.message);
    else setMessage('✅ Профиль обновлён!');
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold cosmic-text">👤 Профиль</h2>

      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl text-white font-bold">
            {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{profile?.full_name || 'Без имени'}</h3>
            <p className="text-sm text-purple-300/60">{user?.email}</p>
            <p className="text-sm text-purple-400/60 mt-1">
              Роль: {profile?.role ? ROLE_LABELS[profile.role] : 'Не указана'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-xl text-sm ${message.startsWith('✅') ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
              {message}
            </div>
          )}
          <div>
            <label className="block text-sm text-purple-200/70 mb-1.5">Полное имя</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="cosmic-input" />
          </div>
          <div>
            <label className="block text-sm text-purple-200/70 mb-1.5">Должность</label>
            <input type="text" value={position} onChange={e => setPosition(e.target.value)} className="cosmic-input" placeholder="A&R менеджер, Продюсер..." />
          </div>
          <div>
            <label className="block text-sm text-purple-200/70 mb-1.5">Email</label>
            <input type="email" value={user?.email || ''} className="cosmic-input opacity-50" disabled />
          </div>
          <button type="submit" disabled={saving} className="cosmic-btn cosmic-btn-primary">
            {saving ? '💾 Сохранение...' : '💾 Сохранить изменения'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🔐 Информация об аккаунте</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-purple-300/60">ID пользователя</span>
            <span className="text-white font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-300/60">Роль</span>
            <span className="text-white">{profile?.role ? ROLE_LABELS[profile.role] : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-300/60">Дата регистрации</span>
            <span className="text-white">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
