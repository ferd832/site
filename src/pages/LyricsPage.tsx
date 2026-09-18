import { useI18n } from '../context/I18nContext';
import TTMLStudio from '../components/ttml/TTMLStudio';

export default function LyricsPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold cosmic-text">{t('Lyrics Studio', 'Студия текстов')}</h2>
        <p className="text-sm text-purple-300/50 mt-1">{t('Professional synced lyrics editor', 'Профессиональный редактор синхронизированных текстов')}</p>
      </div>

      <TTMLStudio />
    </div>
  );
}
