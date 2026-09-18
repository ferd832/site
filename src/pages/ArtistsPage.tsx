import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Artist } from '../types';
import Modal from '../components/common/Modal';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  useEffect(() => { loadArtists(); }, []);

  const loadArtists = async () => {
    const { data } = await supabase.from('artists').select('*').order('created_at', { ascending: false });
    setArtists(data || []);
    setLoading(false);
  };

  const handleSave = async (artistData: Partial<Artist>) => {
    if (editingArtist) {
      await supabase.from('artists').update(artistData).eq('id', editingArtist.id);
    } else {
      await supabase.from('artists').insert([{ ...artistData, created_at: new Date().toISOString() }]);
    }
    setShowEditor(false);
    setEditingArtist(null);
    loadArtists();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить артиста?')) {
      await supabase.from('artists').delete().eq('id', id);
      loadArtists();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-spin-slow" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold cosmic-text">🎤 Артисты</h2>
        <button onClick={() => { setEditingArtist(null); setShowEditor(true); }} className="cosmic-btn cosmic-btn-primary">
          + Новый артист
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {artists.map(artist => (
          <div key={artist.id} className="glass-card p-5 group">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : '🎤'}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold truncate">{artist.stage_name || artist.name}</h3>
                {artist.stage_name && <p className="text-xs text-purple-300/50 truncate">{artist.name}</p>}
              </div>
            </div>
            {artist.bio && <p className="text-sm text-purple-200/60 mb-3 line-clamp-2">{artist.bio}</p>}
            {artist.social_links && Object.keys(artist.social_links).length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {Object.entries(artist.social_links).map(([platform, url]) => (
                  <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer"
                    className="px-2 py-1 rounded-lg bg-white/5 text-xs text-purple-200/60 hover:text-white transition-colors">
                    {platform}
                  </a>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingArtist(artist); setShowEditor(true); }} className="text-xs cosmic-btn py-1 px-2">✏️ Изменить</button>
              <button onClick={() => handleDelete(artist.id)} className="text-xs cosmic-btn py-1 px-2">🗑 Удалить</button>
            </div>
          </div>
        ))}
        {artists.length === 0 && (
          <div className="col-span-full text-center py-12 text-purple-300/40">
            <p className="text-4xl mb-3">🎤</p>
            <p>Нет артистов. Добавьте первого!</p>
          </div>
        )}
      </div>

      <Modal isOpen={showEditor} onClose={() => { setShowEditor(false); setEditingArtist(null); }} title={editingArtist ? 'Редактировать артиста' : 'Новый артист'} size="lg">
        <ArtistForm artist={editingArtist} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingArtist(null); }} />
      </Modal>
    </div>
  );
}

function ArtistForm({ artist, onSave, onCancel }: { artist: Artist | null; onSave: (data: Partial<Artist>) => void; onCancel: () => void }) {
  const [name, setName] = useState(artist?.name || '');
  const [stageName, setStageName] = useState(artist?.stage_name || '');
  const [bio, setBio] = useState(artist?.bio || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, stage_name: stageName || undefined, bio: bio || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Имя *</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="cosmic-input" required />
      </div>
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Сценическое имя</label>
        <input type="text" value={stageName} onChange={e => setStageName(e.target.value)} className="cosmic-input" placeholder="Сценический псевдоним" />
      </div>
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Биография</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} className="cosmic-input min-h-[120px] resize-none" placeholder="Расскажите об артисте..." />
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="cosmic-btn cosmic-btn-primary flex-1">💾 Сохранить</button>
        <button type="button" onClick={onCancel} className="cosmic-btn flex-1">Отмена</button>
      </div>
    </form>
  );
}
