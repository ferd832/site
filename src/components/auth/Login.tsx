import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="stars-bg" />
      <div className="glass-strong rounded-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 animate-spin-slow" />
          <h1 className="text-2xl font-bold cosmic-text">PLANET MUSIC</h1>
          <p className="text-sm text-purple-300/60 mt-1">Label Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-purple-200/70 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="cosmic-input"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-purple-200/70 mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="cosmic-input"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="cosmic-btn cosmic-btn-primary w-full py-3 text-sm font-semibold"
          >
            {loading ? 'Вход...' : '🚀 Войти'}
          </button>
        </form>

        <p className="text-center text-xs text-purple-300/40 mt-6">
          Нет аккаунта? Обратитесь к администратору
        </p>
      </div>
    </div>
  );
}
