import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { Task } from '../types';
import Modal from '../components/common/Modal';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  const handleSave = async (taskData: Partial<Task>) => {
    if (editingTask) {
      await supabase.from('tasks').update(taskData).eq('id', editingTask.id);
    } else {
      await supabase.from('tasks').insert([{ ...taskData, created_at: new Date().toISOString() }]);
    }
    setShowEditor(false);
    setEditingTask(null);
    loadTasks();
  };

  const toggleComplete = async (task: Task) => {
    await supabase.from('tasks').update({ is_completed: !task.is_completed }).eq('id', task.id);
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    loadTasks();
  };

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  });

  const priorityColors = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  const priorityLabels = {
    urgent: '🔴 Срочно',
    high: '🟠 Высокий',
    medium: '🟡 Средний',
    low: '🟢 Низкий',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-spin-slow" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold cosmic-text">✅ Задачи</h2>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            {(['active', 'all', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 text-sm ${filter === f ? 'bg-purple-500/20 text-white' : 'text-purple-300/60 hover:text-white'}`}>
                {f === 'active' ? 'Активные' : f === 'all' ? 'Все' : 'Выполненные'}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditingTask(null); setShowEditor(true); }} className="cosmic-btn cosmic-btn-primary">
            + Новая задача
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(task => (
          <div key={task.id} className={`glass-card p-4 flex items-center gap-4 group ${task.is_completed ? 'opacity-50' : ''}`}>
            <button onClick={() => toggleComplete(task)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                task.is_completed ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/20 hover:border-purple-500'
              }`}>
              {task.is_completed && '✓'}
            </button>
            <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.is_completed ? 'text-purple-300/50 line-through' : 'text-white'}`}>
                {task.title}
              </p>
              {task.description && <p className="text-xs text-purple-300/50 mt-0.5 truncate">{task.description}</p>}
            </div>
            <div className="flex items-center gap-3">
              {task.due_date && (
                <span className="text-xs text-purple-300/50 hidden sm:inline">
                  до {new Date(task.due_date).toLocaleDateString('ru-RU')}
                </span>
              )}
              <span className="text-xs text-purple-300/50">{priorityLabels[task.priority]}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingTask(task); setShowEditor(true); }} className="text-xs cosmic-btn py-1 px-2">✏️</button>
                <button onClick={() => handleDelete(task.id)} className="text-xs cosmic-btn py-1 px-2">🗑</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-purple-300/40">
            <p className="text-4xl mb-3">✅</p>
            <p>{filter === 'active' ? 'Нет активных задач! 🎉' : 'Нет задач'}</p>
          </div>
        )}
      </div>

      <Modal isOpen={showEditor} onClose={() => { setShowEditor(false); setEditingTask(null); }} title={editingTask ? 'Редактировать задачу' : 'Новая задача'}>
        <TaskForm task={editingTask} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingTask(null); }} />
      </Modal>
    </div>
  );
}

function TaskForm({ task, onSave, onCancel }: { task: Task | null; onSave: (data: Partial<Task>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.due_date || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description: description || undefined, priority, due_date: dueDate || undefined, is_completed: task?.is_completed || false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Задача *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="cosmic-input" required />
      </div>
      <div>
        <label className="block text-sm text-purple-200/70 mb-1.5">Описание</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="cosmic-input min-h-[80px] resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-purple-200/70 mb-1.5">Приоритет</label>
          <select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])} className="cosmic-input">
            <option value="low">🟢 Низкий</option>
            <option value="medium">🟡 Средний</option>
            <option value="high">🟠 Высокий</option>
            <option value="urgent">🔴 Срочно</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-purple-200/70 mb-1.5">Дедлайн</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="cosmic-input" />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="cosmic-btn cosmic-btn-primary flex-1">💾 Сохранить</button>
        <button type="button" onClick={onCancel} className="cosmic-btn flex-1">Отмена</button>
      </div>
    </form>
  );
}
