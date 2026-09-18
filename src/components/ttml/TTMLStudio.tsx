import { useState, useRef, useEffect, useCallback } from 'react';
import type { LyricLine } from '../../types';
import { generateId } from '../../utils';
import AudioVisualizer from './AudioVisualizer';

interface TTMLStudioProps {
  onSave: (lyrics: LyricLine[], title: string, artist: string) => void;
}

export default function TTMLStudio({ onSave }: TTMLStudioProps) {
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<'edit' | 'sync' | 'review'>('edit');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [history, setHistory] = useState<LyricLine[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const linesContainerRef = useRef<HTMLDivElement>(null);

  // Добавление в историю
  const addToHistory = useCallback((newLines: LyricLine[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newLines);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLines(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLines(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
      
      if (mode === 'sync') {
        if (e.code === 'Space') {
          e.preventDefault();
          syncCurrentLine();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          navigateLines(-1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          navigateLines(1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, undo, redo, lines, selectedLineId]);

  const navigateLines = (direction: number) => {
    const currentIndex = lines.findIndex(l => l.id === selectedLineId);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < lines.length) {
      setSelectedLineId(lines[newIndex].id);
      // Прокрутка к строке
      const element = document.getElementById(`line-${lines[newIndex].id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const addLine = () => {
    const newLine: LyricLine = {
      id: generateId(),
      text: '',
      startTime: null,
      endTime: null,
    };
    const newLines = [...lines, newLine];
    setLines(newLines);
    addToHistory(newLines);
    setSelectedLineId(newLine.id);
  };

  const updateLine = (id: string, text: string) => {
    const newLines = lines.map(l => l.id === id ? { ...l, text } : l);
    setLines(newLines);
    addToHistory(newLines);
  };

  const deleteLine = (id: string) => {
    const newLines = lines.filter(l => l.id !== id);
    setLines(newLines);
    addToHistory(newLines);
  };

  const syncCurrentLine = () => {
    if (!selectedLineId || !audioRef.current) return;
    
    const time = audioRef.current.currentTime;
    const newLines = lines.map((l, i) => {
      if (l.id === selectedLineId) {
        return { ...l, startTime: time };
      }
      // Автоматически устанавливаем endTime для предыдущей строки
      const currentIndex = lines.findIndex(line => line.id === selectedLineId);
      if (i === currentIndex - 1 && l.endTime === null) {
        return { ...l, endTime: time };
      }
      return l;
    });
    
    setLines(newLines);
    addToHistory(newLines);
    
    // Переход к следующей строке
    navigateLines(1);
  };

  const adjustTime = (id: string, delta: number) => {
    const newLines = lines.map(l => {
      if (l.id === id && l.startTime !== null) {
        const newTime = Math.max(0, l.startTime + delta);
        return { ...l, startTime: newTime };
      }
      return l;
    });
    setLines(newLines);
    addToHistory(newLines);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  const handlePasteText = () => {
    const text = prompt('Вставьте текст песни:');
    if (text) {
      const newLines = text.split('\n').map(line => ({
        id: generateId(),
        text: line.trim(),
        startTime: null,
        endTime: null,
      }));
      setLines(newLines);
      addToHistory(newLines);
    }
  };

  const handleSave = () => {
    onSave(lines, trackTitle, trackArtist);
  };

  const exportTTML = () => {
    const ttml = `<?xml version="1.0" encoding="UTF-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" xml:lang="en">
  <head>
    <metadata>
      <ttm:title>${trackTitle || 'Untitled'}</ttm:title>
    </metadata>
  </head>
  <body>
    <div>
${lines.filter(l => l.text.trim()).map(l => {
  const start = l.startTime !== null ? formatTTMLTime(l.startTime) : '00:00:00.000';
  const end = l.endTime !== null ? formatTTMLTime(l.endTime) : '00:00:00.000';
  return `      <p begin="${start}" end="${end}">${escapeXml(l.text)}</p>`;
}).join('\n')}
    </div>
  </body>
</tt>`;
    downloadFile(ttml, `${trackTitle || 'lyrics'}.ttml`, 'application/xml');
  };

  const exportLRC = () => {
    const lrc = lines.filter(l => l.startTime !== null).map(l => {
      const time = formatLRCTime(l.startTime!);
      return `[${time}]${l.text}`;
    }).join('\n');
    downloadFile(lrc, `${trackTitle || 'lyrics'}.lrc`, 'text/plain');
  };

  const exportSRT = () => {
    const srt = lines.filter(l => l.startTime !== null).map((l, i) => {
      const start = formatSRTTime(l.startTime!);
      const end = formatSRTTime(l.endTime || l.startTime! + 3);
      return `${i + 1}\n${start} --> ${end}\n${l.text}\n`;
    }).join('\n');
    downloadFile(srt, `${trackTitle || 'lyrics'}.srt`, 'text/plain');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

  const formatSRTTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const filteredLines = searchQuery
    ? lines.filter(l => l.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : lines;

  const activeLineIndex = lines.findIndex(l =>
    l.startTime !== null && currentTime >= l.startTime && (l.endTime === null || currentTime < l.endTime)
  );

  return (
    <div className="space-y-6">
      {/* Track Info */}
      <div className="glass-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={trackTitle}
            onChange={e => setTrackTitle(e.target.value)}
            className="cosmic-input"
            placeholder="Название трека"
          />
          <input
            type="text"
            value={trackArtist}
            onChange={e => setTrackArtist(e.target.value)}
            className="cosmic-input"
            placeholder="Артист"
          />
        </div>
      </div>

      {/* Audio Upload & Visualizer */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">🎵 Аудио</h3>
          <button onClick={() => fileInputRef.current?.click()} className="cosmic-btn text-sm">
            📁 Загрузить аудио
          </button>
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
        </div>
        <AudioVisualizer
          audioUrl={audioUrl}
          currentTime={currentTime}
          duration={duration}
          onTimeUpdate={setCurrentTime}
        />
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-xl overflow-hidden border border-white/10">
          {(['edit', 'sync', 'review'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2.5 text-sm transition-all ${
                mode === m ? 'bg-purple-500/20 text-white' : 'text-purple-300/60 hover:text-white'
              }`}
            >
              {m === 'edit' ? '✏️ Редактирование' : m === 'sync' ? '🎯 Синхронизация' : '👁 Просмотр'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={undo} disabled={historyIndex <= 0} className="cosmic-btn text-sm disabled:opacity-30">
          ↶ Отменить
        </button>
        <button onClick={redo} disabled={historyIndex >= history.length - 1} className="cosmic-btn text-sm disabled:opacity-30">
          ↷ Повторить
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="🔍 Поиск по тексту..."
        className="cosmic-input"
      />

      {/* Lyrics Editor */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-white">Текст песни</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={addLine} className="cosmic-btn text-sm">+ Строка</button>
            <button onClick={handlePasteText} className="cosmic-btn text-sm">📋 Вставить текст</button>
            <button onClick={handleSave} className="cosmic-btn cosmic-btn-primary text-sm">💾 Сохранить</button>
            <button onClick={exportTTML} className="cosmic-btn text-sm hidden sm:block">📄 TTML</button>
            <button onClick={exportLRC} className="cosmic-btn text-sm hidden sm:block">📄 LRC</button>
            <button onClick={exportSRT} className="cosmic-btn text-sm hidden sm:block">📄 SRT</button>
          </div>
        </div>

        <div ref={linesContainerRef} className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {filteredLines.map((line, index) => (
            <div
              key={line.id}
              id={`line-${line.id}`}
              onClick={() => setSelectedLineId(line.id)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                selectedLineId === line.id
                  ? 'bg-purple-500/20 border border-purple-500/30'
                  : activeLineIndex === index
                  ? 'bg-pink-500/10 border border-pink-500/20'
                  : 'bg-white/3 hover:bg-white/5'
              }`}
            >
              <span className="text-xs text-purple-300/40 w-6 text-right font-mono">{index + 1}</span>
              <input
                type="text"
                value={line.text}
                onChange={e => updateLine(line.id, e.target.value)}
                className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-purple-300/30"
                placeholder="Введите текст..."
                readOnly={mode === 'review'}
              />
              {line.startTime !== null && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-purple-400/60 font-mono">
                    {formatLRCTime(line.startTime)}
                  </span>
                  {mode === 'edit' && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); adjustTime(line.id, -0.1); }} className="text-xs cosmic-btn py-0.5 px-1.5">
                        -0.1s
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); adjustTime(line.id, 0.1); }} className="text-xs cosmic-btn py-0.5 px-1.5">
                        +0.1s
                      </button>
                    </>
                  )}
                </div>
              )}
              {mode === 'sync' && (
                <button onClick={(e) => { e.stopPropagation(); syncCurrentLine(); }} className="text-xs cosmic-btn py-1 px-2">
                  🎯
                </button>
              )}
              {mode !== 'review' && (
                <button onClick={(e) => { e.stopPropagation(); deleteLine(line.id); }} className="text-purple-300/40 hover:text-red-400 transition-colors text-sm">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {filteredLines.length === 0 && (
          <div className="text-center py-12 text-purple-300/40">
            <p className="text-4xl mb-3">📝</p>
            <p>{searchQuery ? 'Ничего не найдено' : 'Нажмите "+ Строка" или "📋 Вставить текст" чтобы начать'}</p>
          </div>
        )}
      </div>

      {/* Help */}
      {mode === 'sync' && (
        <div className="glass-card p-5 bg-blue-500/5 border-blue-500/20">
          <h4 className="text-sm font-semibold text-white mb-2">💡 Подсказки для синхронизации:</h4>
          <ul className="text-xs text-purple-200/60 space-y-1">
            <li>• <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">Space</kbd> - синхронизировать текущую строку</li>
            <li>• <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">↑</kbd> <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">↓</kbd> - навигация между строками</li>
            <li>• <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">Ctrl+Z</kbd> - отменить, <kbd className="px-2 py-0.5 rounded bg-white/10 text-white">Ctrl+Y</kbd> - повторить</li>
          </ul>
        </div>
      )}
    </div>
  );
}
