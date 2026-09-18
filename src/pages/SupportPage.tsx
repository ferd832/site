import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const { t } = useI18n();
  const [subject, setSubject] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !email || !message) {
      toast.error(t('Fill all fields', 'Заполните все поля'));
      return;
    }
    toast.success(t('Request sent', 'Обращение отправлено'));
    setSubject('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold cosmic-text">{t('Support', 'Поддержка')}</h2>
        <p className="text-sm text-purple-300/50 mt-1">{t('Contact our team', 'Связаться с нашей командой')}</p>
      </div>

      <div className="glass-card p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">
              {t('Subject', 'Тема обращения')} *
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="cosmic-input"
              placeholder={t('Brief description of the issue', 'Краткое описание проблемы')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">
              {t('Email for response', 'Почта для ответа')} *
            </label>
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
            <label className="block text-sm font-medium text-purple-200/80 mb-2">
              {t('Your message', 'Ваше обращение')} *
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="cosmic-input min-h-[200px] resize-none"
              placeholder={t('Describe your issue in detail', 'Опишите вашу проблему подробно')}
              required
            />
          </div>

          <button type="submit" className="cosmic-btn cosmic-btn-primary w-full">
            {t('Send Request', 'Отправить обращение')}
          </button>
        </form>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('FAQ', 'Частые вопросы')}</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-sm font-medium text-white mb-1">{t('How to upload a release?', 'Как загрузить релиз?')}</p>
            <p className="text-xs text-purple-300/60">{t('Go to Releases page and click "New Release"', 'Перейдите на страницу Отгрузки и нажмите "Новая отгрузка"')}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-sm font-medium text-white mb-1">{t('How to sync lyrics?', 'Как синхронизировать текст?')}</p>
            <p className="text-xs text-purple-300/60">{t('Use Lyrics Studio with Space key for sync', 'Используйте Студию текстов с клавишей Space для синхронизации')}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <p className="text-sm font-medium text-white mb-1">{t('How to view statistics?', 'Как посмотреть статистику?')}</p>
            <p className="text-xs text-purple-300/60">{t('Admin can upload CSV files in Statistics page', 'Админ может загрузить CSV файлы на странице Статистика')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
