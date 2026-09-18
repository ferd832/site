import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Release, Track, Artist, Task } from '../types';
import { RELEASE_STATUS_LABELS } from '../types';

export default function Dashboard() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [relRes, trkRes, artRes, taskRes] = await Promise.all([
      supabase.from('releases').select('*'),
      supabase.from('tracks').select('*'),
      supabase.from('artists').select('*'),
      supabase.from('tasks').select('*').eq('is_completed', false),
    ]);
    setReleases(relRes.data || []);
    setTracks(trkRes.data || []);
    setArtists(artRes.data || []);
    setTasks(taskRes.data || []);
    setLoading(false);
  };

  const stats = [
    { label: 'Релизов', value: releases.length, icon: '💿', color: 'from-purple-500/20 to-blue-500/20 border-purple-500/30' },
    { label: 'Треков', value: tracks.length, icon: '🎵', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
    { label: 'Артистов', value: artists.length, icon: '🎤', color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30' },
    { label: 'Задач', value: tasks.length, icon: '✅', color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
  ];

  const statusCounts = Object.keys(RELEASE_STATUS_LABELS).map(status => ({
    status,
    count: releases.filter(r => r.status === status).length,
  })).filter(s => s.count > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className={`glass-card p-5 bg-gradient-to-br ${stat.color} border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-200/60">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <span className="text-3xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Releases */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            💿 Последние релизы
          </h3>
          <div className="space-y-3">
            {releases.slice(0, 5).map(release => (
              <div key={release.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-all">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-lg">
                  {release.cover_url ? (
                    <img src={release.cover_url} alt="" className="w-full h-full rounded-lg object-cover" />
                  ) : '💿'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{release.title}</p>
                  <p className="text-xs text-purple-300/50">{RELEASE_STATUS_LABELS[release.status]}</p>
                </div>
              </div>
            ))}
            {releases.length === 0 && (
              <p className="text-sm text-purple-300/40 text-center py-4">Нет релизов</p>
            )}
          </div>
        </div>

        {/* Active Tasks */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            ✅ Активные задачи
          </h3>
          <div className="space-y-3">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className={`w-3 h-3 rounded-full ${
                  task.priority === 'urgent' ? 'bg-red-500' :
                  task.priority === 'high' ? 'bg-orange-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-purple-300/50">до {new Date(task.due_date).toLocaleDateString('ru-RU')}</p>
                  )}
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-purple-300/40 text-center py-4">Нет активных задач 🎉</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Overview */}
      {statusCounts.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Статусы релизов</h3>
          <div className="flex flex-wrap gap-3">
            {statusCounts.map(({ status, count }) => (
              <div key={status} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <span className="text-sm text-purple-200/70">{RELEASE_STATUS_LABELS[status as keyof typeof RELEASE_STATUS_LABELS]}</span>
                <span className="ml-2 text-lg font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
