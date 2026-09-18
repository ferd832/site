import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../context/I18nContext';
import type { Artist } from '../types';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function ArtistsPage() {
  const { artists, addArtist, updateArtist, deleteArtist } = useData();
  const { t } = useI18n();
  const [showEditor, setShowEditor] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  const handleSave = (data: Partial<Artist>) => {
    if (editingArtist) { updateArtist(editingArtist.id, data); toast.success(t('Artist updated', 'Исполнитель обновлён')); }
    else { addArtist(data); toast.success(t('Artist added', 'Исполнитель добавлен')); }
    setShowEditor(false); setEditingArtist(null);
  };

  const handleDelete = (id: string) => { deleteArtist(id); toast.success(t('Artist deleted', 'Исполнитель удалён')); };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold cosmic-text">{t('Artists', 'Исполнители')}</h2>
          <p className="text-sm text-purple-300/50 mt-1">{t('Artist roster', 'Ростер исполнителей')}</p>
        </div>
        <button onClick={() => { setEditingArtist(null); setShowEditor(true); }} className="cosmic-btn cosmic-btn-primary">+ {t('Add Artist', 'Добавить исполнителя')}</button>
      </div>

      {artists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist, i) => (
            <div key={artist.id} className="glass-card p-5 group animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center text-xl">{artist.stageName ? artist.stageName.charAt(0) : artist.name.charAt(0)}</div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold truncate">{artist.stageName || artist.name}</h3>
                  {artist.stageName && <p className="text-xs text-purple-300/50 truncate">{artist.name}</p>}
                </div>
              </div>
              {artist.bio && <p className="text-sm text-purple-200/60 mb-3 line-clamp-2">{artist.bio}</p>}
              {Object.keys(artist.platforms).length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {Object.keys(artist.platforms).map(p => (
                    <span key={p} className="px-2 py-0.5 rounded bg-white/5 text-xs text-purple-200/60 capitalize">{p}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingArtist(artist); setShowEditor(true); }} className="text-xs cosmic-btn py-1 px-2">{t('Edit', 'Изменить')}</button>
                <button onClick={() => handleDelete(artist.id)} className="text-xs cosmic-btn cosmic-btn-ghost py-1 px-2 hover:!border-red-500/30 hover:!text-red-300">{t('Delete', 'Удалить')}</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-purple-300/40">
          <p className="text-5xl mb-4">🎤</p>
          <p className="text-lg">{t('No artists yet', 'Нет исполнителей')}</p>
        </div>
      )}

      <Modal isOpen={showEditor} onClose={() => { setShowEditor(false); setEditingArtist(null); }} title={editingArtist ? t('Edit Artist', 'Редактировать исполнителя') : t('Add Artist', 'Добавить исполнителя')} size="lg">
        <ArtistForm artist={editingArtist} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingArtist(null); }} t={t} />
      </Modal>
    </div>
  );
}

function ArtistForm({ artist, onSave, onCancel, t }: any) {
  const [name, setName] = useState(artist?.name || '');
  const [stageName, setStageName] = useState(artist?.stageName || '');
  const [bio, setBio] = useState(artist?.bio || '');
  const [appleMusic, setAppleMusic] = useState(artist?.platforms?.appleMusic || '');
  const [spotify, setSpotify] = useState(artist?.platforms?.spotify || '');
  const [yandexMusic, setYandexMusic] = useState(artist?.platforms?.yandexMusic || '');
  const [vkMusic, setVkMusic] = useState(artist?.platforms?.vkMusic || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error(t('Enter artist name', 'Введите имя исполнителя')); return; }
    onSave({ name, stageName: stageName || undefined, bio: bio || undefined, platforms: { appleMusic: appleMusic || undefined, spotify: spotify || undefined, yandexMusic: yandexMusic || undefined, vkMusic: vkMusic || undefined } });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Name', 'Имя')} *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="cosmic-input" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Stage Name', 'Сценическое имя')}</label>
        <input type="text" value={stageName} onChange={e => setStageName(e.target.value)} className="cosmic-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Bio', 'Биография')}</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} className="cosmic-input min-h-[100px] resize-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Platform Links', 'Ссылки на платформы')}</label>
        <div className="space-y-2">
          <input type="url" value={appleMusic} onChange={e => setAppleMusic(e.target.value)} className="cosmic-input" placeholder="Apple Music" />
          <input type="url" value={spotify} onChange={e => setSpotify(e.target.value)} className="cosmic-input" placeholder="Spotify" />
          <input type="url" value={yandexMusic} onChange={e => setYandexMusic(e.target.value)} className="cosmic-input" placeholder="Yandex Music" />
          <input type="url" value={vkMusic} onChange={e => setVkMusic(e.target.value)} className="cosmic-input" placeholder="VK Music" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="cosmic-btn cosmic-btn-primary flex-1">{t('Save', 'Сохранить')}</button>
        <button type="button" onClick={onCancel} className="cosmic-btn cosmic-btn-ghost flex-1">{t('Cancel', 'Отмена')}</button>
      </div>
    </form>
  );
}
