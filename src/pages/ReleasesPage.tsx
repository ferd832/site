import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../context/I18nContext';
import type { Release, ReleaseStatus, ReleaseType, Track, ContentRating } from '../types';
import { RELEASE_STATUS_LABELS, RELEASE_TYPE_LABELS } from '../types';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { generateId } from '../utils';

export default function ReleasesPage() {
  const { releases, artists, addRelease, updateRelease, deleteRelease } = useData();
  const { t, lang } = useI18n();
  const [showEditor, setShowEditor] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);

  const handleSave = (data: Partial<Release>): void => {
    if (editingRelease) {
      updateRelease(editingRelease.id, data);
      toast.success(t('Release updated', 'Отгрузка обновлена'));
    } else {
      addRelease(data);
      toast.success(t('Release created', 'Отгрузка создана'));
    }
    setShowEditor(false);
    setEditingRelease(null);
  };

  const handleDelete = (id: string) => {
    deleteRelease(id);
    toast.success(t('Release deleted', 'Отгрузка удалена'));
  };

  const getArtistName = (id: string) => artists.find(a => a.id === id)?.stageName || artists.find(a => a.id === id)?.name || '';

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold cosmic-text">{t('Releases', 'Отгрузки')}</h2>
          <p className="text-sm text-purple-300/50 mt-1">{t('Manage your releases', 'Управление отгрузками')}</p>
        </div>
        <button onClick={() => { setEditingRelease(null); setShowEditor(true); }} className="cosmic-btn cosmic-btn-primary">
          + {t('New Release', 'Новая отгрузка')}
        </button>
      </div>

      {releases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {releases.map((release, i) => (
            <div key={release.id} className="glass-card p-5 group animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{release.type === 'album' ? '💿' : release.type === 'ep' ? '📀' : '🎵'}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border status-${release.status}`}>
                  {RELEASE_STATUS_LABELS[release.status][lang]}
                </span>
              </div>
              <h3 className="text-white font-semibold mb-1 truncate">{release.title}</h3>
              <p className="text-xs text-purple-300/50 mb-2">
                {RELEASE_TYPE_LABELS[release.type][lang]} • {release.tracks.length} {t('tracks', 'треков')}
              </p>
              {release.mainArtists.length > 0 && (
                <p className="text-xs text-purple-300/50 mb-3">{release.mainArtists.map(getArtistName).join(', ')}</p>
              )}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingRelease(release); setShowEditor(true); }} className="text-xs cosmic-btn py-1 px-2">{t('Edit', 'Изменить')}</button>
                <button onClick={() => handleDelete(release.id)} className="text-xs cosmic-btn cosmic-btn-ghost py-1 px-2 hover:!border-red-500/30 hover:!text-red-300">{t('Delete', 'Удалить')}</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-purple-300/40">
          <p className="text-5xl mb-4">💿</p>
          <p className="text-lg">{t('No releases yet', 'Нет отгрузок')}</p>
          <p className="text-sm mt-1">{t('Create your first release', 'Создайте первую отгрузку')}</p>
        </div>
      )}

      <Modal isOpen={showEditor} onClose={() => { setShowEditor(false); setEditingRelease(null); }} title={editingRelease ? t('Edit Release', 'Редактировать отгрузку') : t('New Release', 'Новая отгрузка')} size="xl">
        <ReleaseForm release={editingRelease} artists={artists} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingRelease(null); }} t={t} lang={lang} />
      </Modal>
    </div>
  );
}

function ReleaseForm({ release, artists, onSave, onCancel, t, lang }: any) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ReleaseType>(release?.type || 'single');
  const [title, setTitle] = useState(release?.title || '');
  const [contractFile, setContractFile] = useState(release?.contractFileName || '');
  const [tracks, setTracks] = useState<Track[]>(release?.tracks || []);
  const [mainArtists, setMainArtists] = useState<string[]>(release?.mainArtists || []);
  const [genre, setGenre] = useState(release?.genre || '');
  const [subgenre, setSubgenre] = useState(release?.subgenre || '');
  const [label, setLabel] = useState(release?.label || '');
  const [upc, setUpc] = useState(release?.upc || '');
  const [copyrightNotice, setCopyrightNotice] = useState(release?.copyrightNotice || '');
  const [phonographicCopyright, setPhonographicCopyright] = useState(release?.phonographicCopyright || '');
  const [releaseDate, setReleaseDate] = useState(release?.releaseDate || '');
  const [originalReleaseDate, setOriginalReleaseDate] = useState(release?.originalReleaseDate || '');
  const [yandexFutureRelease, setYandexFutureRelease] = useState(release?.yandexFutureRelease || false);
  const [artistBio, setArtistBio] = useState(release?.artistBio || '');
  const [promoLinks, setPromoLinks] = useState<string[]>(release?.promoLinks || []);

  const addTrack = () => {
    const newTrack: Track = {
      id: generateId(),
      title: '',
      contentRating: { isCover: 0, isInstrumental: 0, explicitLyrics: 0, drugReferences: 0, aiText: 0, aiInstrumental: 0 },
      artists: [],
      authors: [],
      order: tracks.length,
    };
    setTracks([...tracks, newTrack]);
  };

  const updateTrack = (id: string, data: Partial<Track>) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, ...data } : t));
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(t('Enter release title', 'Введите название отгрузки'));
      return;
    }
    if (!contractFile) {
      toast.error(t('Contract is required', 'Договор обязателен'));
      return;
    }
    onSave({
      type, title, contractFileName: contractFile, tracks, mainArtists,
      genre, subgenre, label, upc, copyrightNotice, phonographicCopyright,
      releaseDate, originalReleaseDate, yandexFutureRelease, artistBio, promoLinks,
    });
  };

  const steps = [
    t('Tracklist', 'Треклист'),
    t('Album Info', 'Об альбоме'),
    t('Release Date', 'Дата выпуска'),
    t('Promo & Pitching', 'Промо и питчинг'),
  ];

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i + 1)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${step === i + 1 ? 'bg-purple-500/20 text-white border border-purple-500/30' : 'bg-white/3 text-purple-300/60 hover:text-white'}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Step 1: Tracklist */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Release Type', 'Тип отгрузки')} *</label>
            <select value={type} onChange={e => setType(e.target.value as ReleaseType)} className="cosmic-select">
              <option value="single">{t('Single', 'Сингл')}</option>
              <option value="ep">EP</option>
              <option value="album">{t('Album', 'Альбом')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Title', 'Название')} *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="cosmic-input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Contract', 'Договор')} *</label>
            <input type="text" value={contractFile} onChange={e => setContractFile(e.target.value)} className="cosmic-input" placeholder={t('Contract file name or link', 'Название файла договора или ссылка')} />
            <p className="text-xs text-purple-300/40 mt-1">{t('Legal agreement between label and artist', 'Юридическая форма между лейблом и исполнителем')}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-purple-200/80">{t('Tracks', 'Треки')}</label>
              <button onClick={addTrack} className="cosmic-btn text-sm">+ {t('Add Track', 'Добавить трек')}</button>
            </div>
            <div className="space-y-3">
              {tracks.map((track, i) => (
                <TrackEditor key={track.id} track={track} index={i} onUpdate={(data: Partial<Track>) => updateTrack(track.id, data)} onRemove={() => removeTrack(track.id)} t={t} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Album Info */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Main Artist(s)', 'Главный исполнитель(и)')} *</label>
            <select multiple value={mainArtists} onChange={e => setMainArtists(Array.from(e.target.selectedOptions, o => o.value))} className="cosmic-select min-h-[100px]">
              {artists.map((a: any) => <option key={a.id} value={a.id}>{a.stageName || a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Genre', 'Жанр')}</label>
              <input type="text" value={genre} onChange={e => setGenre(e.target.value)} className="cosmic-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Subgenre', 'Поджанр')}</label>
              <input type="text" value={subgenre} onChange={e => setSubgenre(e.target.value)} className="cosmic-input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Label', 'Лейбл')}</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} className="cosmic-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">UPC</label>
            <input type="text" value={upc} onChange={e => setUpc(e.target.value)} className="cosmic-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Copyright (C-line)', 'Авторское право (C-line)')}</label>
            <input type="text" value={copyrightNotice} onChange={e => setCopyrightNotice(e.target.value)} className="cosmic-input" placeholder="© 2026 ..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Phonographic Copyright (P-line)', 'Фонографическое право (P-line)')}</label>
            <input type="text" value={phonographicCopyright} onChange={e => setPhonographicCopyright(e.target.value)} className="cosmic-input" placeholder="℗ 2026 ..." />
          </div>
        </div>
      )}

      {/* Step 3: Release Date */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Release Date', 'Дата выпуска')}</label>
            <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="cosmic-input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Original Release Date', 'Оригинальная дата выпуска')}</label>
            <input type="date" value={originalReleaseDate} onChange={e => setOriginalReleaseDate(e.target.value)} className="cosmic-input" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={yandexFutureRelease} onChange={e => setYandexFutureRelease(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm text-purple-200/80">{t('Future release on Yandex Music', 'Будущий релиз в Яндекс Музыке')}</span>
          </label>
        </div>
      )}

      {/* Step 4: Promo */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Artist Bio', 'Об исполнителе')}</label>
            <textarea value={artistBio} onChange={e => setArtistBio(e.target.value)} className="cosmic-input min-h-[120px] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Promo Links', 'Промо ссылки')}</label>
            <input type="text" value={promoLinks.join(', ')} onChange={e => setPromoLinks(e.target.value.split(',').map(s => s.trim()))} className="cosmic-input" placeholder="https://..." />
            <p className="text-xs text-purple-300/40 mt-1">{t('Comma-separated links', 'Ссылки через запятую')}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {step > 1 && <button onClick={() => setStep(step - 1)} className="cosmic-btn cosmic-btn-ghost flex-1">{t('Back', 'Назад')}</button>}
        {step < 4 ? <button onClick={() => setStep(step + 1)} className="cosmic-btn cosmic-btn-primary flex-1">{t('Next', 'Далее')}</button> : <button onClick={handleSubmit} className="cosmic-btn cosmic-btn-primary flex-1">{t('Save', 'Сохранить')}</button>}
        <button onClick={onCancel} className="cosmic-btn cosmic-btn-ghost flex-1">{t('Cancel', 'Отмена')}</button>
      </div>
    </div>
  );
}

function TrackEditor({ track, index, onUpdate, onRemove, t }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-purple-300/50 font-mono">#{index + 1}</span>
        <input type="text" value={track.title} onChange={e => onUpdate({ title: e.target.value })} className="flex-1 cosmic-input py-2" placeholder={t('Track title', 'Название трека')} />
        <button onClick={() => setExpanded(!expanded)} className="text-xs cosmic-btn py-1 px-2">{expanded ? '▲' : '▼'}</button>
        <button onClick={onRemove} className="text-xs cosmic-btn cosmic-btn-ghost py-1 px-2 hover:!border-red-500/30 hover:!text-red-300">✕</button>
      </div>
      {expanded && (
        <div className="space-y-3 mt-3 pt-3 border-t border-white/5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-purple-200/60 mb-1">{t('Version', 'Версия')}</label>
              <input type="text" value={track.version || ''} onChange={e => onUpdate({ version: e.target.value })} className="cosmic-input py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-purple-200/60 mb-1">ISRC</label>
              <div className="flex gap-2">
                <input type="text" value={track.isrc || ''} onChange={e => onUpdate({ isrc: e.target.value })} className="flex-1 cosmic-input py-1.5 text-sm" />
                {!track.isrc && <button onClick={() => onUpdate({ isrc: 'AUTO-' + Math.random().toString(36).substr(2, 8).toUpperCase(), isrcAssigned: true })} className="cosmic-btn text-xs py-1 px-2">{t('Assign', 'Присвоить')}</button>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-purple-200/60 mb-1">{t('Genre', 'Жанр')}</label>
              <input type="text" value={track.genre || ''} onChange={e => onUpdate({ genre: e.target.value })} className="cosmic-input py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-purple-200/60 mb-1">{t('Subgenre', 'Поджанр')}</label>
              <input type="text" value={track.subgenre || ''} onChange={e => onUpdate({ subgenre: e.target.value })} className="cosmic-input py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-purple-200/60 mb-1">{t('Preview Start (seconds)', 'Начало предпрослушивания (секунды)')}</label>
            <input type="number" value={track.previewStart || ''} onChange={e => onUpdate({ previewStart: parseInt(e.target.value) || 0 })} className="cosmic-input py-1.5 text-sm" placeholder="30" />
          </div>
          <div>
            <label className="block text-xs text-purple-200/60 mb-2">{t('Content Rating', 'Маркировка')}</label>
            <div className="space-y-2">
              {([
                ['isCover', t('Cover', 'Кавер')],
                ['isInstrumental', t('Instrumental', 'Инструментал')],
                ['explicitLyrics', t('Explicit Lyrics', 'Нецензурная лексика')],
                ['drugReferences', t('Drug References', 'Упоминание наркотиков')],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-purple-200/60 w-32">{label}</span>
                  <input type="range" min="0" max="100" value={track.contentRating[key]} onChange={e => onUpdate({ contentRating: { ...track.contentRating, [key]: parseInt(e.target.value) } })} className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
                  <span className="text-xs text-purple-300/50 w-8 text-right">{track.contentRating[key]}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-purple-200/60 mb-2">{t('AI Usage', 'Использование ИИ')}</label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-purple-200/60 w-32">{t('AI Text', 'ИИ текст')}</span>
                <input type="range" min="0" max="100" value={track.contentRating.aiText} onChange={e => onUpdate({ contentRating: { ...track.contentRating, aiText: parseInt(e.target.value) } })} className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
                <span className="text-xs text-purple-300/50 w-8 text-right">{track.contentRating.aiText}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-purple-200/60 w-32">{t('AI Instrumental', 'ИИ инструментал')}</span>
                <input type="range" min="0" max="100" value={track.contentRating.aiInstrumental} onChange={e => onUpdate({ contentRating: { ...track.contentRating, aiInstrumental: parseInt(e.target.value) } })} className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
                <span className="text-xs text-purple-300/50 w-8 text-right">{track.contentRating.aiInstrumental}%</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-purple-200/60 mb-1">{t('Lyrics', 'Текст песни')}</label>
            <textarea value={track.lyrics || ''} onChange={e => onUpdate({ lyrics: e.target.value })} className="cosmic-input py-1.5 text-sm min-h-[80px] resize-none" />
          </div>
        </div>
      )}
    </div>
  );
}
