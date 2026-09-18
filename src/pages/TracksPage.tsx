import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { Track } from '../types';
import { formatDuration } from '../utils';
import Modal from '../components/common/Modal';

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { loadTracks(); }, []);

  const loadTracks = async () => {
    const { data } = await supabase.from('tracks').select('*').order('created_at', { ascending: false });
    setTracks(data || []);
    setLoading(false);
  };

  const handlePlay = (track: Track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current && track.audio_url) {
        audioRef.current.src = track.audio_url;
        audioRef.current.play();
        setPlayingId(track.id);
      }
    }
  };

  const handleSave = async (trackData: Partial<Track>) => {
    if (editingTrack) {
      await supabase.from('tracks').update(trackData).eq('id', editingTrack.id);
    } else {
      await supabase.from('tracks').insert([{ ...trackData, created_at: new Date().toISOString() }]);
    }
    setShowEditor(false);
    setEditingTrack(null);
    loadTracks();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить трек?')) {
      await supabase.from('tracks').delete().eq('id', id);
      loadTracks();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-spin-slow" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold cosmic-text">🎵 Треки</h2>
        <button onClick={() => { setEditingTrack(null); setShowEditor(true); }} className="cosmic-btn cosmic-btn-primary">
          + Новый трек
        </button>
      </div>

      <div className="space-y-3">
        {tracks.map(track => (
          <div key={track.id} className="glass-card p-4 flex items-center gap-4 group">
            <button
              onClick={() => handlePlay(track)}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-xl hover:from-purple-500/50 hover:to-pink-500/50 transition-all flex-shrink-0"
            >
              {playingId === track.id ? '⏸' : '▶️'}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{track.title}</h3>
              <div className="flex items-center gap-3 text-xs text-purple-300/50 mt-1">
                {track.genre && <span>{track.genre}</span>}
                {track.bpm && <span>{track.bpm} BPM</span>}
                {track.key_signature && <span>{track.key_signature}</span>}
                {track.duration && <span>{formatDuration(track.duration)}</span>}
              </div>
            </div>
            {track.mood && (
              <span className="px-2 py-1 rounded-lg bg-white/5 text-xs text-purple-200/60 hidden sm:inline">
                {track.mood}
              </span>
            )}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingTrack(track); setShowEditor(true); }} className="text-xs cosmic-btn py-1 px-2">✏️</button>
              <button onClick={() => handleDelete(track.id)} className="text-xs cosmic-btn py-1 px-2">🗑</button>
            </div>
          </div>
        ))}
        {tracks.length === 0 && (
          <div className="text-center py-12 text-purple-300/40">
            <p className="text-4xl mb-3">🎵</p>
            <p>Нет треков. Добавьте первый!</p>
          </div>
        )}
      </div>

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      <Modal isOpen={showEditor} onClose={() => { setShowEditor(false); setEditingTrack(null); }} title={editingTrack ? 'Редактировать трек' : 'Новый трек'} size="lg">
        <TrackForm track={editingTrack} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingTrack(null); }} />
      </Modal>
    </div>
  );
}

function TrackForm({ track, onSave, onCancel }: { track: Track | null; onSave: (data: Partial<Track>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(track?.title || '');
  const [genre, setGenre] = useState(track?.genre || '');
  const [bpm, setBpm] = useState(track?.bpm?.toString() || '');
  const [keySig, setKeySig] = useState(track?.key_signature || '');
  const [mood, setMood] = useState(track?.mood || '');
  const [duration, setDuration] = useState(track?.duration?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      genre: genre || undefined,
      bpm: bpm ? parseInt(bpm) : undefined,
      key_signature: keySig || undefined,
      mood: mood || undefined,
      duration: duration ? parseInt(duration) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Название *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="cosmic-input" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-purple-200/70 mb-1.5">Жанр</label>
          <input type="text" value={genre} onChange={e => setGenre(e.target.value)} className="cosmic-input" placeholder="Pop, Rock..." />
        </div>
        <div>
          <label className="block text-sm text-purple-200/70 mb-1.5">BPM</label>
          <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} className="cosmic-input" placeholder="120" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-purple-200/70 mb-1.5">Тональность</label>
          <input type="text" value={keySig} onChange={e => setKeySig(e.target.value)} className="cosmic-input" placeholder="Am, C..." />
        </div>
        <div>
          <label className="block text-sm text-purple-200/70 mb-1.5">Настроение</label>
          <input type="text" value={mood} onChange={e => setMood(e.target.value)} className="cosmic-input" placeholder="Happy, Sad..." />
        </div>
      </div>
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Длительность (сек)</label>
        <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="cosmic-input" placeholder="240" />
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="cosmic-btn cosmic-btn-primary flex-1">💾 Сохранить</button>
        <button type="button" onClick={onCancel} className="cosmic-btn flex-1">Отмена</button>
      </div>
    </form>
  );
}
