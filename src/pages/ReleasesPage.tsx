import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Release, ReleaseStatus, ReleaseType } from '../types';
import { RELEASE_STATUS_LABELS } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showEditor, setShowEditor] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReleaseStatus | 'all'>('all');

  useEffect(() => { loadReleases(); }, []);

  const loadReleases = async () => {
    const { data } = await supabase.from('releases').select('*').order('updated_at', { ascending: false });
    setReleases(data || []);
    setLoading(false);
  };

  const handleSave = async (releaseData: Partial<Release>) => {
    if (editingRelease) {
      await supabase.from('releases').update({ ...releaseData, updated_at: new Date().toISOString() }).eq('id', editingRelease.id);
    } else {
      await supabase.from('releases').insert([{ ...releaseData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
    }
    setShowEditor(false);
    setEditingRelease(null);
    loadReleases();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Удалить релиз?')) {
      await supabase.from('releases').delete().eq('id', id);
      loadReleases();
    }
  };

  const handleStatusChange = async (id: string, status: ReleaseStatus) => {
    await supabase.from('releases').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    loadReleases();
  };

  const filtered = filterStatus === 'all' ? releases : releases.filter(r => r.status === filterStatus);
  const statuses: ReleaseStatus[] = ['idea', 'recording', 'mixing', 'mastering', 'artwork', 'pitching', 'ready', 'released', 'archived'];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-spin-slow" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold cosmic-text">💿 Релизы</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="cosmic-input w-auto"
          >
            <option value="all">Все статусы</option>
            {statuses.map(s => <option key={s} value={s}>{RELEASE_STATUS_LABELS[s]}</option>)}
          </select>
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-purple-500/20 text-white' : 'text-purple-300/60 hover:text-white'}`}>📋</button>
            <button onClick={() => setViewMode('kanban')} className={`px-3 py-2 text-sm ${viewMode === 'kanban' ? 'bg-purple-500/20 text-white' : 'text-purple-300/60 hover:text-white'}`}>📊</button>
          </div>
          <button onClick={() => { setEditingRelease(null); setShowEditor(true); }} className="cosmic-btn cosmic-btn-primary">
            + Новый релиз
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(release => (
            <div key={release.id} className="glass-card p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-2xl overflow-hidden">
                  {release.cover_url ? <img src={release.cover_url} alt="" className="w-full h-full object-cover" /> : '💿'}
                </div>
                <StatusBadge status={release.status} size="sm" />
              </div>
              <h3 className="text-white font-semibold mb-1 truncate">{release.title}</h3>
              <p className="text-xs text-purple-300/50 mb-3 capitalize">{release.type} {release.release_date ? `• ${new Date(release.release_date).toLocaleDateString('ru-RU')}` : ''}</p>
              {release.description && <p className="text-sm text-purple-200/60 mb-3 line-clamp-2">{release.description}</p>}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingRelease(release); setShowEditor(true); }} className="text-xs cosmic-btn py-1 px-2">✏️ Изменить</button>
                <button onClick={() => handleDelete(release.id)} className="text-xs cosmic-btn py-1 px-2">🗑 Удалить</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-purple-300/40">
              <p className="text-4xl mb-3">💿</p>
              <p>Нет релизов. Создайте первый!</p>
            </div>
          )}
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map(status => {
            const columnReleases = filtered.filter(r => r.status === status);
            return (
              <div key={status} className="min-w-[260px] flex-shrink-0">
                <div className="glass-card p-3 mb-3">
                  <StatusBadge status={status} size="sm" />
                  <span className="ml-2 text-xs text-purple-300/50">{columnReleases.length}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {columnReleases.map(release => (
                    <div
                      key={release.id}
                      className="glass-card p-3 cursor-grab hover:border-purple-500/50 transition-all"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('releaseId', release.id)}
                    >
                      <p className="text-sm text-white font-medium truncate">{release.title}</p>
                      <p className="text-xs text-purple-300/50 capitalize">{release.type}</p>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-2 p-3 rounded-xl border-2 border-dashed border-white/5 hover:border-purple-500/30 transition-all min-h-[60px] flex items-center justify-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData('releaseId');
                    if (id) handleStatusChange(id, status);
                  }}
                >
                  <span className="text-xs text-purple-300/30">Перетащите сюда</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      <Modal isOpen={showEditor} onClose={() => { setShowEditor(false); setEditingRelease(null); }} title={editingRelease ? 'Редактировать релиз' : 'Новый релиз'} size="lg">
        <ReleaseForm release={editingRelease} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingRelease(null); }} />
      </Modal>
    </div>
  );
}

function ReleaseForm({ release, onSave, onCancel }: { release: Release | null; onSave: (data: Partial<Release>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(release?.title || '');
  const [type, setType] = useState<ReleaseType>(release?.type || 'single');
  const [status, setStatus] = useState<ReleaseStatus>(release?.status || 'idea');
  const [releaseDate, setReleaseDate] = useState(release?.release_date || '');
  const [description, setDescription] = useState(release?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, type, status, release_date: releaseDate || undefined, description: description || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Название *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="cosmic-input" placeholder="Название релиза" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-purple-200/70 mb-1.5">Тип</label>
          <select value={type} onChange={e => setType(e.target.value as ReleaseType)} className="cosmic-input">
            <option value="single">Сингл</option>
            <option value="ep">EP</option>
            <option value="album">Альбом</option>
            <option value="compilation">Сборник</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-purple-200/70 mb-1.5">Статус</label>
          <select value={status} onChange={e => setStatus(e.target.value as ReleaseStatus)} className="cosmic-input">
            {Object.entries(RELEASE_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Дата релиза</label>
        <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="cosmic-input" />
      </div>
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Описание</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="cosmic-input min-h-[100px] resize-none" placeholder="Описание релиза..." />
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="cosmic-btn cosmic-btn-primary flex-1">💾 Сохранить</button>
        <button type="button" onClick={onCancel} className="cosmic-btn flex-1">Отмена</button>
      </div>
    </form>
  );
}
