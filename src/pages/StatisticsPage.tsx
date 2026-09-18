import { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';

interface StreamData {
  date: string;
  streams: number;
  platform: string;
}

export default function StatisticsPage() {
  const { t } = useI18n();
  const { profile } = useData();
  const [period, setPeriod] = useState<'week' | 'month' | '3months' | 'year' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [streamData, setStreamData] = useState<StreamData[]>([]);

  // Check if user is admin
  if (profile.role !== 'admin') {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-4">🔒</p>
          <p className="text-lg text-purple-300/60">{t('Access Denied', 'Доступ запрещён')}</p>
          <p className="text-sm text-purple-300/40 mt-2">{t('Only administrators can view statistics', 'Только администраторы могут просматривать статистику')}</p>
        </div>
      </div>
    );
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const parsed: StreamData[] = lines.slice(1).map(line => {
          const parts = line.split(',');
          const date = parts[0]?.trim() || '';
          const streams = parseInt(parts[1]?.trim() || '0');
          const platform = parts[2]?.trim() || 'Unknown';
          return { date, streams, platform };
        });
        setStreamData(parsed);
        toast.success(t('Statistics uploaded', 'Статистика загружена'));
      } catch {
        toast.error(t('Error parsing file', 'Ошибка при разборе файла'));
      }
    };
    reader.readAsText(file);
  };

  const getFilteredData = () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = customStart ? new Date(customStart) : new Date(0);
        break;
      default:
        startDate = new Date(0);
    }

    const endDate = period === 'custom' && customEnd ? new Date(customEnd) : now;

    return streamData.filter(d => {
      const date = new Date(d.date);
      return date >= startDate && date <= endDate;
    });
  };

  const filteredData = getFilteredData();
  const totalStreams = filteredData.reduce((sum, d) => sum + d.streams, 0);
  const avgStreams = filteredData.length > 0 ? Math.round(totalStreams / filteredData.length) : 0;
  const maxStreams = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.streams)) : 0;

  const platformStats = filteredData.reduce((acc, d) => {
    acc[d.platform] = (acc[d.platform] || 0) + d.streams;
    return acc;
  }, {} as Record<string, number>);

  const chartMax = maxStreams || 1;
  const chartData = filteredData.slice(-30);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold cosmic-text">{t('Listening Statistics', 'Статистика прослушиваний')}</h2>
          <p className="text-sm text-purple-300/50 mt-1">{t('Analytics and streaming data', 'Аналитика и данные прослушиваний')}</p>
        </div>
        <label className="cosmic-btn cosmic-btn-primary cursor-pointer">
          {t('Upload Statistics', 'Загрузить статистику')}
          <input type="file" accept=".csv,.txt" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {/* Period Selector */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-purple-200/80">{t('Period', 'Период')}:</span>
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            {([
              ['week', t('Week', 'Неделя')],
              ['month', t('Month', 'Месяц')],
              ['3months', t('3 Months', '3 месяца')],
              ['year', t('Year', 'Год')],
              ['custom', t('Custom', 'Свой')],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={`px-4 py-2 text-sm transition-all ${period === value ? 'bg-purple-500/20 text-white' : 'text-purple-300/60 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="cosmic-input py-1.5 text-sm" />
              <span className="text-purple-300/50">—</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="cosmic-input py-1.5 text-sm" />
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
          <p className="text-sm text-purple-200/60 mb-1">{t('Total Streams', 'Всего прослушиваний')}</p>
          <p className="text-3xl font-bold text-white">{totalStreams.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/20">
          <p className="text-sm text-purple-200/60 mb-1">{t('Average per Day', 'Среднее в день')}</p>
          <p className="text-3xl font-bold text-white">{avgStreams.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20">
          <p className="text-sm text-purple-200/60 mb-1">{t('Peak Day', 'Пиковый день')}</p>
          <p className="text-3xl font-bold text-white">{maxStreams.toLocaleString()}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('Streams Over Time', 'Прослушивания по времени')}</h3>
          <div className="h-64 flex items-end gap-1">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t transition-all hover:from-purple-400 hover:to-pink-400 cursor-pointer relative"
                  style={{ height: `${(d.streams / chartMax) * 100}%`, minHeight: '4px' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-space-900 border border-purple-500/30 rounded px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {d.streams.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-purple-300/40">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[chartData.length - 1]?.date}</span>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-lg text-purple-300/60">{t('No data available', 'Нет данных')}</p>
          <p className="text-sm text-purple-300/40 mt-2">{t('Upload CSV file with columns: date, streams, platform', 'Загрузите CSV файл с колонками: дата, прослушивания, платформа')}</p>
        </div>
      )}

      {/* Platform Stats */}
      {Object.keys(platformStats).length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('Streams by Platform', 'Прослушивания по платформам')}</h3>
          <div className="space-y-3">
            {Object.entries(platformStats)
              .sort((a, b) => b[1] - a[1])
              .map(([platform, streams]) => (
                <div key={platform} className="flex items-center gap-4">
                  <span className="text-sm text-purple-200/80 w-32">{platform}</span>
                  <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-end px-3"
                      style={{ width: `${(streams / totalStreams) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">{streams.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className="text-sm text-purple-300/60 w-16 text-right">{((streams / totalStreams) * 100).toFixed(1)}%</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
