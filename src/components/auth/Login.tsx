import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useI18n } from '../../context/I18nContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useData();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('Fill all fields', 'Заполните все поля'));
      return;
    }
    
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 animate-spin-slow" />
          <h1 className="text-3xl font-bold cosmic-text mb-2">PLANET MUSIC</h1>
          <p className="text-sm text-purple-300/60">{t('Label Management', 'Управление лейблом')}</p>
        </div>

        <div className="glass-strong rounded-3xl p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Email', 'Электронная почта')}</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="cosmic-input" 
                placeholder="your@email.com" 
                required 
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Password', 'Пароль')}</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="cosmic-input" 
                placeholder="••••••••" 
                required 
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="cosmic-btn cosmic-btn-primary w-full py-3.5 disabled:opacity-50"
            >
              {loading ? t('Signing in...', 'Вход...') : t('Sign In', 'Войти')}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-purple-300/40 text-center">
              {t('No account? Contact administrator', 'Нет аккаунта? Обратитесь к администратору')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
