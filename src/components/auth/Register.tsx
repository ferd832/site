import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import type { UserRole } from '../../types';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role,
      });
      if (profileError) setError(profileError.message);
      else setSuccess('Регистрация успешна! Проверьте email для подтверждения.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="stars-bg" />
      <div className="glass-strong rounded-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 animate-spin-slow" />
          <h1 className="text-2xl font-bold cosmic-text">Регистрация</h1>
          <p className="text-sm text-purple-300/60 mt-1">PLANET MUSIC</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">{error}</div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm text-green-300">{success}</div>
          )}
          <div>
            <label className="block text-sm text-purple-200/70 mb-1.5">Имя</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="cosmic-input" placeholder="Иван Иванов" required />
          </div>
          <div>
            <label className="block text-sm text-purple-200/70 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="cosmic-input" placeholder="your@email.com" required />
          </div>
          <div>
            <label className="block text-sm text-purple-200/70 mb-1.5">Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="cosmic-input" placeholder="Минимум 6 символов" required minLength={6} />
          </div>
          <div>
            <label className="block text-sm text-purple-200/70 mb-1.5">Роль</label>
            <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="cosmic-input">
              <option value="viewer">Просмотр</option>
              <option value="editor">Редактор</option>
              <option value="artist">Артист</option>
              <option value="manager">Менеджер</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="cosmic-btn cosmic-btn-primary w-full py-3 text-sm font-semibold">
            {loading ? 'Регистрация...' : '✨ Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  );
}
