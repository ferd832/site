import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../context/I18nContext';
import type { Lyric } from '../types';
import TTMLStudio from '../components/ttml/TTMLStudio';
import toast from 'react-hot-toast';

export default function LyricsPage() {
  const { lyrics, addLyric, updateLyric, deleteLyric } = useData();
  const { t } = useI18n();
  const [selectedLyricId, setSelectedLyricId] = useState<string | null>(null);

  const handleSave = (lines: any[], title: string, artist: string) => {
    const lyricData = {
      rawText: lines.map((l: any) => l.text).join('\n'),
      syncedData: lines,
      format: 'ttml',
      status: 'draft' as const,
      version: selectedLyricId ? (lyrics.find(l => l.id === selectedLyricId)?.version || 1) + 1 : 1,
    };
    if (selectedLyricId) { updateLyric(selectedLyricId, lyricData); toast.success(t('Lyrics updated', 'Текст обновлён')); }
    else { const newId = addLyric(lyricData); setSelectedLyricId(newId); toast.success(t('Lyrics saved', 'Текст сохранён')); }
  };

  const handleDelete = (id: string) => { deleteLyric(id); if (selectedLyricId === id) setSelectedLyricId(null); toast.success(t('Lyrics deleted', 'Текст удалён')); };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold cosmic-text">{t('Lyrics Studio', 'Студия текстов')}</h2>
        <p className="text-sm text-purple-300/50 mt-1">{t('Professional synced lyrics editor', 'Профессиональный редактор синхронизированных текстов')}</p>
      </div>

      <TTMLStudio onSave={handleSave} />

      {lyrics.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4">{t('Saved Lyrics', 'Сохранённые тексты')} ({lyrics.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lyrics.map(l => (
              <div key={l.id} onClick={() => setSelectedLyricId(l.id)} className={`p-4 rounded-xl transition-all cursor-pointer ${selectedLyricId === l.id ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/3 hover:bg-white/8 border border-transparent'}`}>
                <p className="text-sm text-white truncate font-medium">{l.rawText?.split('\n')[0] || t('Untitled', 'Без названия')}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-purple-300/50">v{l.version} • {new Date(l.updatedAt).toLocaleDateString()}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id); }} className="text-xs text-purple-300/40 hover:text-red-400">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
