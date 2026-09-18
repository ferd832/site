import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { LyricLine, TrackInfo, AppMode, Lyric } from '../types';
import { generateId, formatDuration } from '../utils';

export default function LyricsPage() {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [trackInfo, setTrackInfo] = useState<TrackInfo>({ title: '', artist: '', album: '' });
  const [mode, setMode] = useState<AppMode>('edit');
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedLyrics, setSavedLyrics] = useState<Lyric[]>([]);
  const [selectedLyricId, setSelectedLyricId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadSavedLyrics(); }, []);

  const loadSavedLyrics = async () => {
    const { data } = await supabase.from('lyrics').select('*').order('updated_at', { ascending: false });
    setSavedLyrics(data || []);
  };

  const loadLyric = (lyric: Lyric) => {
    setSelectedLyricId(lyric.id);
    if (lyric.synced_data) setLyrics(lyric.synced_data);
    else if (lyric.raw_text) {
      const lines = lyric.raw_text.split('\n').map(text => ({
        id: generateId(), text, startTime: null, endTime: null
      }));
      setLyrics(lines);
    }
  };

  const addLine = () => {
    setLyrics([...lyrics, { id: generateId(), text: '', startTime: null, endTime: null }]);
  };

  const updateLine = (id: string, text: string) => {
    setLyrics(lyrics.map(l => l.id === id ? { ...l, text } : l));
  };

  const deleteLine = (id: string) => {
    setLyrics(lyrics.filter(l => l.id !== id));
  };

  const syncLine = (id: string) => {
    const time = currentTime;
    setLyrics(lyrics.map((l, i) => {
      if (l.id === id) {
        return { ...l, startTime: time };
      }
      // Set endTime for previous line
      const idx = lyrics.findIndex(ll => ll.id === id);
      if (i === idx - 1 && l.endTime === null) {
        return { ...l, endTime: time };
      }
      return l;
    }));
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); }
    else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const saveToSupabase = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const lyricData = {
      track_id: null,
      user_id: user?.id,
      raw_text: lyrics.map(l => l.text).join('\n'),
      synced_data: lyrics,
      format: 'ttml',
      status: 'draft' as const,
      version: 1,
      updated_at: new Date().toISOString(),
    };

    if (selectedLyricId) {
      await supabase.from('lyrics').update(lyricData).eq('id', selectedLyricId);
    } else {
      const { data } = await supabase.from('lyrics').insert([{ ...lyricData, created_at: new Date().toISOString() }]).select().single();
      if (data) setSelectedLyricId(data.id);
    }
    setSaving(false);
    loadSavedLyrics();
  };

  const exportTTML = () => {
    const ttml = `<?xml version="1.0" encoding="UTF-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" xml:lang="en">
  <body>
    <div>
${lyrics.filter(l => l.text.trim()).map(l => {
  const start = l.startTime !== null ? formatTTMLTime(l.startTime) : '00:00:00.000';
  const end = l.endTime !== null ? formatTTMLTime(l.endTime) : '00:00:00.000';
  return `      <p begin="${start}" end="${end}">${escapeXml(l.text)}</p>`;
}).join('\n')}
    </div>
  </body>
</tt>`;
    const blob = new Blob([ttml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trackInfo.title || 'lyrics'}.ttml`;
    a.click();
  };

  const exportLRC = () => {
    const lrc = lyrics.filter(l => l.startTime !== null).map(l => {
      const time = formatLRCTime(l.startTime!);
      return `[${time}]${l.text}`;
    }).join('\n');
    const blob = new Blob([lrc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trackInfo.title || 'lyrics'}.lrc`;
    a.click();
  };

  const formatTTMLTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const formatLRCTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const activeLineIndex = lyrics.findIndex(l => 
    l.startTime !== null && currentTime >= l.startTime && (l.endTime === null || currentTime < l.endTime)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold cosmic-text">📝 TTML Studio</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            {(['edit', 'sync', 'review'] as AppMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-2 text-sm capitalize ${mode === m ? 'bg-purple-500/20 text-white' : 'text-purple-300/60 hover:text-white'}`}>
                {m === 'edit' ? '✏️' : m === 'sync' ? '🎯' : '👁'} {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Track Info */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="text" value={trackInfo.title} onChange={e => setTrackInfo({ ...trackInfo, title: e.target.value })}
            className="cosmic-input" placeholder="Название трека" />
          <input type="text" value={trackInfo.artist} onChange={e => setTrackInfo({ ...trackInfo, artist: e.target.value })}
            className="cosmic-input" placeholder="Артист" />
          <input type="text" value={trackInfo.album} onChange={e => setTrackInfo({ ...trackInfo, album: e.target.value })}
            className="cosmic-input" placeholder="Альбом" />
        </div>
      </div>

      {/* Audio Player */}
      <div className="glass-card p-4 flex items-center gap-4">
        <button onClick={togglePlay} disabled={!audioFile}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl disabled:opacity-30">
          {isPlaying ? '⏸' : '▶️'}
        </button>
        <div className="flex-1">
          {audioFile ? (
            <audio ref={audioRef} src={audioFile}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onEnded={() => setIsPlaying(false)} />
          ) : null}
          <div className="flex items-center gap-3">
            <span className="text-sm text-purple-300/60 font-mono">{formatDuration(currentTime)}</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: audioRef.current ? `${(currentTime / (audioRef.current.duration || 1)) * 100}%` : '0%' }} />
            </div>
          </div>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="cosmic-btn text-sm">
          🎵 Загрузить аудио
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
      </div>

      {/* Lyrics Editor */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Текст песни</h3>
          <div className="flex items-center gap-2">
            <button onClick={addLine} className="cosmic-btn text-sm">+ Строка</button>
            <button onClick={saveToSupabase} disabled={saving} className="cosmic-btn cosmic-btn-primary text-sm">
              {saving ? '💾 Сохранение...' : '💾 Сохранить'}
            </button>
            <button onClick={exportTTML} className="cosmic-btn text-sm">📄 TTML</button>
            <button onClick={exportLRC} className="cosmic-btn text-sm">📄 LRC</button>
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {lyrics.map((line, index) => (
            <div key={line.id}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                activeLineIndex === index ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/3 hover:bg-white/5'
              }`}>
              <span className="text-xs text-purple-300/40 w-6 text-right">{index + 1}</span>
              <input
                type="text"
                value={line.text}
                onChange={e => updateLine(line.id, e.target.value)}
                className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-purple-300/30"
                placeholder="Введите текст..."
                readOnly={mode === 'review'}
              />
              {line.startTime !== null && (
                <span className="text-xs text-purple-400/60 font-mono">{formatDuration(line.startTime)}</span>
              )}
              {mode === 'sync' && (
                <button onClick={() => syncLine(line.id)} className="text-xs cosmic-btn py-0.5 px-2">
                  🎯
                </button>
              )}
              {mode !== 'review' && (
                <button onClick={() => deleteLine(line.id)} className="text-purple-300/40 hover:text-red-400 transition-colors text-sm">✕</button>
              )}
            </div>
          ))}
        </div>

        {lyrics.length === 0 && (
          <div className="text-center py-8 text-purple-300/40">
            <p className="text-3xl mb-2">📝</p>
            <p>Нажмите "+ Строка" чтобы начать</p>
          </div>
        )}
      </div>

      {/* Saved Lyrics */}
      {savedLyrics.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-lg font-semibold text-white mb-3">📂 Сохранённые тексты</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {savedLyrics.map(l => (
              <button key={l.id} onClick={() => loadLyric(l)}
                className={`p-3 rounded-xl text-left transition-all ${
                  selectedLyricId === l.id ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/3 hover:bg-white/8'
                }`}>
                <p className="text-sm text-white truncate">{l.raw_text?.split('\n')[0] || 'Без названия'}</p>
                <p className="text-xs text-purple-300/50 mt-1">v{l.version} • {new Date(l.updated_at).toLocaleDateString('ru-RU')}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
