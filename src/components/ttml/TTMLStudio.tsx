import { useState, useRef, useCallback, useEffect } from 'react';
import { LyricLine, TrackInfo, AppMode } from './types';
import { generateTTML, generateLRC, generateSRT, downloadFile, formatTime, generateId, shiftLineTime, shiftAllTimes, parseTimeToSeconds } from './utils';
import AudioPlayer, { AudioPlayerHandle } from './AudioPlayer';
import { useUndoRedo } from './useUndoRedo';
import type { Lyric } from '../../types';

interface TTMLStudioProps {
  onSave?: (lines: LyricLine[], title: string, artist: string, album: string) => void;
  initialData?: Lyric | null;
}

export default function TTMLStudio({ onSave, initialData }: TTMLStudioProps) {
  const [mode, setMode] = useState<AppMode>('edit');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  const { 
    state: lines, 
    setState: setLines, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
  } = useUndoRedo<LyricLine[]>([
    { id: generateId(), text: '', startTime: null, endTime: null },
  ]);
  
  const {
    state: trackInfo,
    setState: setTrackInfo,
  } = useUndoRedo<TrackInfo>({ title: '', artist: '', album: '' });
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSyncLine, setCurrentSyncLine] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<'ttml' | 'lrc' | 'srt'>('ttml');
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalShift, setGlobalShift] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncLineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  
  const currentTimeRef = useRef(currentTime);
  const currentSyncLineRef = useRef(currentSyncLine);
  const linesRef = useRef(lines);

  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { currentSyncLineRef.current = currentSyncLine; }, [currentSyncLine]);
  useEffect(() => { linesRef.current = lines; }, [lines]);

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.syncedData && initialData.syncedData.length > 0) {
        setLines(initialData.syncedData);
      } else if (initialData.rawText) {
        const parsedLines = initialData.rawText.split('\n').map(text => ({
          id: generateId(),
          text,
          startTime: null,
          endTime: null,
        }));
        setLines(parsedLines);
      }
      setTrackInfo({
        title: initialData.trackTitle || '',
        artist: initialData.artistName || '',
        album: initialData.albumName || '',
      });
    }
  }, [initialData]);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(URL.createObjectURL(file));
      setAudioFile(file);
    }
  };

  const handleTimeUpdate = useCallback((time: number) => { setCurrentTime(time); }, []);

  const addLine = () => { setLines(prev => [...prev, { id: generateId(), text: '', startTime: null, endTime: null }]); };
  const updateLineText = (id: string, text: string) => { setLines(prev => prev.map(l => l.id === id ? { ...l, text } : l)); };
  const deleteLine = (id: string) => { setLines(prev => prev.length === 1 ? prev : prev.filter(l => l.id !== id)); };

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const handleImport = () => {
    const textLines = importText.split('\n').filter(l => l.trim() !== '');
    const newLines: LyricLine[] = textLines.map(text => ({ id: generateId(), text: text.trim(), startTime: null, endTime: null }));
    if (newLines.length > 0) { setLines(newLines); setCurrentSyncLine(0); }
    setShowImport(false);
    setImportText('');
  };

  const syncCurrentLine = useCallback(() => {
    const currentLine = currentSyncLineRef.current;
    const currentLines = linesRef.current;
    if (currentLine >= currentLines.length) return;
    const line = currentLines[currentLine];
    if (line.text.trim() === '') { setCurrentSyncLine(prev => Math.min(prev + 1, currentLines.length - 1)); return; }
    const time = currentTimeRef.current;
    setLines(prev => prev.map((l, i) => {
      if (i === currentLine) return { ...l, startTime: time };
      if (i === currentLine - 1 && l.startTime !== null) return { ...l, endTime: time };
      return l;
    }));
    let nextLine = currentLine + 1;
    while (nextLine < currentLines.length && currentLines[nextLine].text.trim() === '') nextLine++;
    setCurrentSyncLine(Math.min(nextLine, currentLines.length - 1));
  }, []);

  const markLineUnsynced = (index: number) => {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, startTime: null, endTime: null } : l));
  };

  const adjustLineTime = (index: number, delta: number) => {
    setLines(prev => prev.map((l, i) => i === index ? shiftLineTime(l, delta) : l));
  };

  const setLineTime = (index: number, timeStr: string) => {
    const seconds = parseTimeToSeconds(timeStr);
    if (seconds !== null) {
      setLines(prev => prev.map((l, i) => i === index ? { ...l, startTime: seconds } : l));
    }
  };

  const playLineSegment = (index: number) => {
    const line = lines[index];
    if (!line.startTime || !audioPlayerRef.current) return;
    
    const sortedSynced = lines
      .filter(l => l.startTime !== null)
      .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    
    const lineIdx = sortedSynced.findIndex(l => l.id === line.id);
    const endTime = line.endTime || 
      (lineIdx < sortedSynced.length - 1 ? sortedSynced[lineIdx + 1].startTime! : line.startTime + 5);
    
    audioPlayerRef.current.playSegment(line.startTime - 0.5, endTime + 0.5);
  };

  const applyGlobalShift = () => {
    if (globalShift !== 0) {
      setLines(prev => shiftAllTimes(prev, globalShift));
      setGlobalShift(0);
    }
  };

  useEffect(() => {
    if (mode !== 'sync') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); syncCurrentLine(); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); setCurrentSyncLine(prev => Math.min(prev + 1, linesRef.current.length - 1)); }
      else if (e.code === 'ArrowUp') { e.preventDefault(); setCurrentSyncLine(prev => Math.max(prev - 1, 0)); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, syncCurrentLine]);

  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [undo, redo]);

  useEffect(() => {
    if (mode === 'sync' && syncLineRefs.current[currentSyncLine]) {
      syncLineRefs.current[currentSyncLine]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSyncLine, mode]);

  useEffect(() => { return () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }; }, [audioUrl]);

  const handleRemoveAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null); setAudioFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    const base = trackInfo.title || 'lyrics';
    if (exportFormat === 'ttml') {
      downloadFile(generateTTML(lines, trackInfo), `${base}.ttml`, 'application/ttml+xml');
    } else if (exportFormat === 'lrc') {
      downloadFile(generateLRC(lines), `${base}.lrc`, 'text/plain');
    } else {
      downloadFile(generateSRT(lines), `${base}.srt`, 'text/plain');
    }
    setShowExport(false);
  };

  const getExportPreview = () => {
    if (exportFormat === 'ttml') return generateTTML(lines, trackInfo);
    if (exportFormat === 'lrc') return generateLRC(lines);
    return generateSRT(lines);
  };

  const getExportFilename = () => {
    const base = trackInfo.title || 'lyrics';
    return `${base}.${exportFormat}`;
  };

  const syncProgress = lines.filter(l => l.startTime !== null).length;
  const totalLines = lines.filter(l => l.text.trim() !== '').length;
  const syncedLines = lines.filter(l => l.startTime !== null).sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  const filteredLines = searchQuery 
    ? lines.map((line, index) => ({ line, index })).filter(({ line }) => line.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : lines.map((line, index) => ({ line, index }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-medium text-purple-300/70 mb-3 flex items-center gap-2"><span className="text-lg">🪐</span>Информация о треке</h3>
          <div className="space-y-2">
            <input type="text" placeholder="Название трека" value={trackInfo.title} onChange={e => setTrackInfo({ ...trackInfo, title: e.target.value })} className="w-full cosmic-input rounded-xl px-4 py-2.5 text-sm text-white" />
            <input type="text" placeholder="Исполнитель" value={trackInfo.artist} onChange={e => setTrackInfo({ ...trackInfo, artist: e.target.value })} className="w-full cosmic-input rounded-xl px-4 py-2.5 text-sm text-white" />
            <input type="text" placeholder="Альбом (опционально)" value={trackInfo.album} onChange={e => setTrackInfo({ ...trackInfo, album: e.target.value })} className="w-full cosmic-input rounded-xl px-4 py-2.5 text-sm text-white" />
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-medium text-purple-300/70 mb-3 flex items-center gap-2"><span className="text-lg">🎧</span>Аудио файл</h3>
          {audioUrl ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{audioFile?.name}</p>
                <p className="text-xs text-purple-300/50">{audioFile ? `${(audioFile.size / 1024 / 1024).toFixed(2)} MB` : ''}</p>
              </div>
              <button onClick={handleRemoveAudio} className="text-purple-300/50 hover:text-pink-400 transition-colors p-2 rounded-lg hover:bg-white/5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-24 border border-dashed border-purple-500/30 rounded-xl cursor-pointer hover:border-purple-500/60 hover:bg-purple-500/5 transition-all">
              <svg className="w-8 h-8 text-purple-400/50 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
              <span className="text-xs text-purple-300/50">Загрузить аудио (WAV, MP3, OGG)</span>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {audioUrl && (
        <div className="mb-6">
          <AudioPlayer
            ref={audioPlayerRef}
            audioUrl={audioUrl}
            audioFile={audioFile}
            onTimeUpdate={handleTimeUpdate}
            isSyncing={mode === 'sync'}
            onPlayPause={setIsPlaying}
            isPlaying={isPlaying}
          />
        </div>
      )}

      {mode === 'sync' && (
        <div className="mb-4 glass rounded-xl p-4 flex items-center gap-4">
          <div className="flex-1 bg-black/30 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 transition-all duration-300" style={{ width: `${totalLines > 0 ? (syncProgress / totalLines) * 100 : 0}%` }} />
          </div>
          <span className="text-sm text-purple-200/70 font-mono">{syncProgress}/{totalLines}</span>
        </div>
      )}

      {(mode === 'sync' || mode === 'review') && syncProgress > 0 && (
        <div className="mb-4 glass rounded-xl p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-purple-300/70">⏱ Сдвиг всех таймкодов:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setGlobalShift(prev => prev - 0.1)} className="px-2 py-1 bg-white/5 border border-purple-500/20 rounded text-xs text-purple-200 hover:bg-white/10 transition-all">-0.1s</button>
              <button onClick={() => setGlobalShift(prev => prev - 0.5)} className="px-2 py-1 bg-white/5 border border-purple-500/20 rounded text-xs text-purple-200 hover:bg-white/10 transition-all">-0.5s</button>
              <button onClick={() => setGlobalShift(prev => prev - 1)} className="px-2 py-1 bg-white/5 border border-purple-500/20 rounded text-xs text-purple-200 hover:bg-white/10 transition-all">-1s</button>
            </div>
            <input
              type="number"
              step="0.1"
              value={globalShift}
              onChange={e => setGlobalShift(parseFloat(e.target.value) || 0)}
              className="w-20 cosmic-input rounded-lg px-2 py-1 text-sm text-white text-center font-mono"
            />
            <span className="text-xs text-purple-300/50">сек</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setGlobalShift(prev => prev + 0.1)} className="px-2 py-1 bg-white/5 border border-purple-500/20 rounded text-xs text-purple-200 hover:bg-white/10 transition-all">+0.1s</button>
              <button onClick={() => setGlobalShift(prev => prev + 0.5)} className="px-2 py-1 bg-white/5 border border-purple-500/20 rounded text-xs text-purple-200 hover:bg-white/10 transition-all">+0.5s</button>
              <button onClick={() => setGlobalShift(prev => prev + 1)} className="px-2 py-1 bg-white/5 border border-purple-500/20 rounded text-xs text-purple-200 hover:bg-white/10 transition-all">+1s</button>
            </div>
            <button onClick={applyGlobalShift} disabled={globalShift === 0} className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${globalShift !== 0 ? 'cosmic-btn text-white' : 'bg-white/5 text-purple-400/30 cursor-not-allowed'}`}>
              Применить
            </button>
          </div>
        </div>
      )}

      {mode === 'edit' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-purple-500/10 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button onClick={addLine} className="px-4 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-sm text-purple-200 hover:text-white hover:border-purple-500/50 transition-all">+ Добавить строку</button>
              <button onClick={() => setShowImport(true)} className="px-4 py-2 bg-white/5 border border-purple-500/20 rounded-lg text-sm text-purple-200 hover:text-white hover:border-purple-500/50 transition-all">📋 Вставить текст</button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="🔍 Поиск..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="cosmic-input rounded-lg px-3 py-1.5 text-sm text-white w-40"
              />
              <span className="text-sm text-purple-300/50">{lines.length} строк</span>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {filteredLines.map(({ line, index }) => (
              <div key={line.id} className="flex items-center gap-3 px-5 py-3 border-b border-purple-500/5 hover:bg-purple-500/5 group transition-colors">
                <span className="text-xs text-purple-400/40 w-8 text-right font-mono">{index + 1}</span>
                {line.startTime !== null && (
                  <span className="text-xs text-purple-300 font-mono bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">{formatTime(line.startTime)}</span>
                )}
                <input type="text" value={line.text} onChange={e => updateLineText(line.id, e.target.value)} placeholder={`Строка ${index + 1}...`} className="flex-1 bg-transparent border-none text-sm text-white placeholder-purple-400/30 focus:outline-none" />
                <button onClick={() => deleteLine(line.id)} className="opacity-0 group-hover:opacity-100 text-purple-300/40 hover:text-pink-400 transition-all p-1 rounded">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'sync' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-purple-500/10 bg-black/20">
            <div className="flex items-center gap-3">
              <span className="text-sm text-purple-200/70">Нажмите <kbd className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-200 font-mono">Space</kbd> для синхронизации</span>
            </div>
            <button onClick={() => setMode('edit')} className="px-3 py-1.5 bg-white/5 border border-purple-500/20 rounded-lg text-sm text-purple-200 hover:text-white hover:border-purple-500/50 transition-all">← Назад</button>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-4">
            {lines.map((line, index) => (
              <div key={line.id} ref={el => { syncLineRefs.current[index] = el; }} onClick={() => setCurrentSyncLine(index)} className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 cursor-pointer transition-all ${index === currentSyncLine ? 'bg-gradient-to-r from-purple-500/20 via-blue-500/15 to-pink-500/20 border border-purple-500/40' : line.startTime !== null ? 'bg-white/5 border border-transparent' : 'bg-transparent border border-transparent hover:bg-white/5'}`}>
                <span className={`text-xs w-6 text-center font-mono ${index === currentSyncLine ? 'text-pink-300' : 'text-purple-400/40'}`}>{index + 1}</span>

                {line.startTime !== null ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-blue-300 font-mono bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">{formatTime(line.startTime)}</span>
                    <button onClick={(e) => { e.stopPropagation(); adjustLineTime(index, -0.1); }} className="p-1 text-purple-300/40 hover:text-pink-400 transition-colors rounded hover:bg-white/5" title="-0.1s">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); adjustLineTime(index, 0.1); }} className="p-1 text-purple-300/40 hover:text-green-400 transition-colors rounded hover:bg-white/5" title="+0.1s">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingLine(index); }} className="p-1 text-purple-300/40 hover:text-blue-400 transition-colors rounded hover:bg-white/5" title="Редактировать">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                  </div>
                ) : index === currentSyncLine ? (
                  <span className="text-xs text-purple-300 font-mono bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md animate-pulse">Ожидание...</span>
                ) : (
                  <span className="text-xs text-purple-400/30 font-mono">--:--</span>
                )}

                <span className={`flex-1 text-sm ${index === currentSyncLine ? 'text-white font-medium' : line.startTime !== null ? 'text-purple-100/80' : 'text-purple-300/40'}`}>
                  {line.text || <span className="italic text-purple-400/30">(пустая строка)</span>}
                </span>

                {line.startTime !== null && (
                  <button onClick={(e) => { e.stopPropagation(); playLineSegment(index); }} className="text-purple-300/40 hover:text-green-400 transition-colors p-1 rounded hover:bg-white/5" title="Прослушать строку">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                )}

                {line.startTime !== null && (
                  <button onClick={(e) => { e.stopPropagation(); markLineUnsynced(index); }} className="text-purple-300/40 hover:text-pink-400 transition-colors p-1 rounded" title="Сбросить время">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 py-4 border-t border-purple-500/10 flex justify-center">
            <button onClick={syncCurrentLine} className="px-8 py-3 cosmic-btn rounded-xl text-white font-medium flex items-center gap-2">
              <span className="text-lg">✨</span>Синхронизировать (Space)
            </button>
          </div>
        </div>
      )}

      {mode === 'review' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-purple-500/10">
            <h3 className="text-sm font-medium text-purple-300/70 flex items-center gap-2"><span className="text-lg">🔭</span>Предпросмотр синхронизации</h3>
            <span className="text-xs text-purple-200/50 font-mono">{formatTime(currentTime)}</span>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-4">
            {syncedLines.length === 0 ? (
              <div className="text-center py-8 text-purple-300/50"><p className="text-lg mb-2">Нет синхронизированных строк</p><p className="text-sm">Перейдите в режим синхронизации и привяжите текст к аудио</p></div>
            ) : (
              syncedLines.map((line, index) => {
                const isActive = currentTime >= (line.startTime || 0) && (index === syncedLines.length - 1 || currentTime < (syncedLines[index + 1]?.startTime || Infinity));
                return (
                  <div key={line.id} className={`px-4 py-3 rounded-xl mb-1 transition-all ${isActive ? 'bg-gradient-to-r from-purple-500/20 via-blue-500/15 to-pink-500/20 border border-purple-500/40 scale-[1.02]' : currentTime > (line.startTime || 0) ? 'text-purple-200/50' : 'text-purple-400/30'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-purple-400/50 font-mono w-20">{formatTime(line.startTime!)}</span>
                      <span className={`flex-1 text-sm ${isActive ? 'text-white font-medium' : ''}`}>{line.text}</span>
                      <button onClick={() => { const sortedSynced = lines.filter(l => l.startTime !== null).sort((a, b) => (a.startTime || 0) - (b.startTime || 0)); const lineIdx = sortedSynced.findIndex(l => l.id === line.id); const endTime = line.endTime || (lineIdx < sortedSynced.length - 1 ? sortedSynced[lineIdx + 1].startTime! : line.startTime! + 5); audioPlayerRef.current?.playSegment(line.startTime! - 0.5, endTime + 0.5); }} className="text-purple-300/40 hover:text-green-400 transition-colors p-1 rounded hover:bg-white/5" title="Прослушать">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold cosmic-text mb-4 flex items-center gap-2"><span className="text-xl">📋</span>Вставить текст</h3>
            {syncProgress > 0 && <div className="mb-3 p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg"><p className="text-sm text-pink-200">⚠️ Внимание: импорт заменит все текущие строки и сбросит синхронизацию!</p></div>}
            <p className="text-sm text-purple-200/60 mb-3">Каждая строка — отдельная строка текста</p>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Вставьте текст песни сюда..." className="w-full h-64 cosmic-input rounded-xl p-4 text-sm text-white resize-none" autoFocus />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowImport(false)} className="px-4 py-2 text-sm text-purple-200/60 hover:text-white transition-colors">Отмена</button>
              <button onClick={handleImport} className="cosmic-btn px-5 py-2 rounded-xl text-sm text-white font-medium">Импортировать</button>
            </div>
          </div>
        </div>
      )}

      {showExport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-strong rounded-2xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-bold cosmic-text mb-4 flex items-center gap-2"><span className="text-xl">🚀</span>Экспорт синхронизированного текста</h3>

            <div className="flex items-center gap-2 mb-4 bg-black/30 rounded-xl p-1 border border-purple-500/10">
              <button onClick={() => setExportFormat('ttml')} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${exportFormat === 'ttml' ? 'cosmic-btn text-white shadow-lg' : 'text-purple-200/60 hover:text-white hover:bg-white/5'}`}>
                TTML <span className="text-xs opacity-60">(Apple)</span>
              </button>
              <button onClick={() => setExportFormat('lrc')} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${exportFormat === 'lrc' ? 'cosmic-btn text-white shadow-lg' : 'text-purple-200/60 hover:text-white hover:bg-white/5'}`}>
                LRC <span className="text-xs opacity-60">(унив.)</span>
              </button>
              <button onClick={() => setExportFormat('srt')} className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${exportFormat === 'srt' ? 'cosmic-btn text-white shadow-lg' : 'text-purple-200/60 hover:text-white hover:bg-white/5'}`}>
                SRT <span className="text-xs opacity-60">(субтитры)</span>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-black/30 border border-purple-500/10 rounded-xl p-3"><div className="text-xs text-purple-300/50 mb-1">Таймкоды</div><div className="text-white font-mono text-lg">{syncProgress}</div></div>
              <div className="bg-black/30 border border-purple-500/10 rounded-xl p-3"><div className="text-xs text-purple-300/50 mb-1">Строк</div><div className="text-white font-mono text-lg">{lines.filter(l => l.text.trim()).length}</div></div>
              <div className="bg-black/30 border border-purple-500/10 rounded-xl p-3"><div className="text-xs text-purple-300/50 mb-1">Файл</div><div className="text-white font-mono text-sm truncate">{getExportFilename()}</div></div>
            </div>

            <div className="bg-black/40 border border-purple-500/10 rounded-xl p-3 max-h-48 overflow-y-auto mb-4">
              <pre className="text-xs text-purple-200/50 font-mono whitespace-pre-wrap">{getExportPreview().substring(0, 1500)}{getExportPreview().length > 1500 ? '\n...' : ''}</pre>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowExport(false)} className="px-4 py-2 text-sm text-purple-200/60 hover:text-white transition-colors">Отмена</button>
              <button onClick={handleExport} disabled={syncProgress === 0} className={`px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${syncProgress === 0 ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' : 'cosmic-btn text-white'}`}>
                <span>💾</span> Скачать .{exportFormat}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-xl p-1 border border-purple-500/10">
          <button onClick={() => setMode('edit')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'edit' ? 'cosmic-btn text-white shadow-lg' : 'text-purple-200/60 hover:text-white hover:bg-white/5'}`}>✏️ Редактор</button>
          <button onClick={() => setMode('sync')} disabled={!audioUrl} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'sync' ? 'cosmic-btn text-white shadow-lg' : 'text-purple-200/60 hover:text-white hover:bg-white/5'}`}>🎵 Синхронизация</button>
          <button onClick={() => setMode('review')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'review' ? 'cosmic-btn text-white shadow-lg' : 'text-purple-200/60 hover:text-white hover:bg-white/5'}`}>👁 Просмотр</button>
        </div>

        <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-xl p-1 border border-purple-500/10">
          <button onClick={undo} disabled={!canUndo} className={`p-2 rounded-lg transition-all ${canUndo ? 'text-purple-200/80 hover:text-white hover:bg-white/10' : 'text-purple-400/20 cursor-not-allowed'}`} title="Отменить (Ctrl+Z)">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
          </button>
          <button onClick={redo} disabled={!canRedo} className={`p-2 rounded-lg transition-all ${canRedo ? 'text-purple-200/80 hover:text-white hover:bg-white/10' : 'text-purple-400/20 cursor-not-allowed'}`} title="Повторить (Ctrl+Shift+Z)">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
          </button>
        </div>

        {onSave && (
          <button 
            onClick={() => onSave(lines, trackInfo.title, trackInfo.artist, trackInfo.album)} 
            className="cosmic-btn cosmic-btn-primary px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
            Сохранить
          </button>
        )}
        
        <button onClick={() => setShowExport(true)} className="cosmic-btn px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          Скачать
        </button>
      </div>
    </div>
  );
}
