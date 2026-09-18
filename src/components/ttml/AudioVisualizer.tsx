import { useState, useRef, useEffect } from 'react';
import type { LyricLine } from '../../types';
import { generateId } from '../../utils';

interface AudioVisualizerProps {
  audioUrl: string | null;
  currentTime: number;
  duration: number;
  onTimeUpdate: (time: number) => void;
}

export default function AudioVisualizer({ audioUrl, currentTime, duration, onTimeUpdate }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Генерируем визуализацию волны
    const generateWaveform = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const rawData = audioBuffer.getChannelData(0);
        const samples = 100;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          filteredData.push(sum / blockSize);
        }
        
        // Нормализация
        const max = Math.max(...filteredData);
        const normalized = filteredData.map(v => v / max);
        setWaveformData(normalized);
      } catch (err) {
        console.error('Error generating waveform:', err);
      }
    };

    generateWaveform();
  }, [audioUrl]);

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      const barWidth = width / waveformData.length;
      const progress = duration > 0 ? currentTime / duration : 0;
      
      waveformData.forEach((value, i) => {
        const barHeight = value * height * 0.8;
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        
        // Градиент для активной части
        if (i / waveformData.length <= progress) {
          const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
          gradient.addColorStop(0, '#a855f7');
          gradient.addColorStop(1, '#ec4899');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        }
        
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      });
    };

    draw();
  }, [waveformData, currentTime, duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !duration) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    onTimeUpdate(newTime);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={100}
          onClick={handleCanvasClick}
          className="w-full h-24 rounded-xl cursor-pointer bg-white/3 border border-white/5"
        />
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={(e) => {}}
          />
        )}
      </div>
      {audioUrl && (
        <button
          onClick={togglePlay}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          {isPlaying ? '⏸ Пауза' : '▶️ Воспроизвести'}
        </button>
      )}
    </div>
  );
}
