import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../context/I18nContext';
import type { Task } from '../types';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useData();
  const { t } = useI18n();
  const [showEditor, setShowEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const handleSave = (data: Partial<Task>) => {
    if (editingTask) { updateTask(editingTask.id, data); toast.success(t('Task updated', 'Задача обновлена')); }
    else { addTask(data); toast.success(t('Task created', 'Задача создана')); }
    setShowEditor(false); setEditingTask(null);
  };

  const handleDelete = (id: string) => { deleteTask(id); toast.success(t('Task deleted', 'Задача удалена')); };
  const handleToggle = (task: Task) => { toggleTask(task.id); if (!task.isCompleted) toast.success(t('Completed!', 'Выполнено!')); };

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold cosmic-text">{t('Tasks', 'Задачи')}</h2>
          <p className="text-sm text-purple-300/50 mt-1">{t('Manage your tasks', 'Управление задачами')}</p>
        </div>
        <button onClick={() => { setEditingTask(null); setShowEditor(true); }} className="cosmic-btn cosmic-btn-primary">+ {t('New Task', 'Новая задача')}</button>
      </div>

      <div className="flex rounded-xl overflow-hidden border border-white/10 w-fit">
        {(['active', 'all', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2.5 text-sm transition-all ${filter === f ? 'bg-purple-500/20 text-white' : 'text-purple-300/60 hover:text-white'}`}>
            {f === 'active' ? t('Active', 'Активные') : f === 'all' ? t('All', 'Все') : t('Completed', 'Выполненные')}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((task, i) => (
            <div key={task.id} className={`glass-card p-4 flex items-center gap-4 group animate-slide-up ${task.isCompleted ? 'opacity-60' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>
              <button onClick={() => handleToggle(task)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.isCompleted ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/20 hover:border-purple-500'}`}>
                {task.isCompleted && '✓'}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.isCompleted ? 'text-purple-300/50 line-through' : 'text-white'}`}>{task.title}</p>
                {task.description && <p className="text-xs text-purple-300/50 mt-0.5 truncate">{task.description}</p>}
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditingTask(task); setShowEditor(true); }} className="text-xs cosmic-btn py-1 px-2">{t('Edit', 'Изменить')}</button>
                <button onClick={() => handleDelete(task.id)} className="text-xs cosmic-btn cosmic-btn-ghost py-1 px-2 hover:!border-red-500/30 hover:!text-red-300">{t('Delete', 'Удалить')}</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-purple-300/40">
          <p className="text-5xl mb-4">{filter === 'active' ? '🎉' : '✅'}</p>
          <p className="text-lg">{filter === 'active' ? t('No active tasks!', 'Нет активных задач!') : t('No tasks', 'Нет задач')}</p>
        </div>
      )}

      <Modal isOpen={showEditor} onClose={() => { setShowEditor(false); setEditingTask(null); }} title={editingTask ? t('Edit Task', 'Редактировать задачу') : t('New Task', 'Новая задача')}>
        <TaskForm task={editingTask} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingTask(null); }} t={t} />
      </Modal>
    </div>
  );
}

function TaskForm({ task, onSave, onCancel, t }: any) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error(t('Enter task title', 'Введите название задачи')); return; }
    onSave({ title, description: description || undefined, priority, dueDate: dueDate || undefined, isCompleted: task?.isCompleted || false });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Task', 'Задача')} *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="cosmic-input" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Description', 'Описание')}</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="cosmic-input min-h-[80px] resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Priority', 'Приоритет')}</label>
          <select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])} className="cosmic-select">
            <option value="low">{t('Low', 'Низкий')}</option>
            <option value="medium">{t('Medium', 'Средний')}</option>
            <option value="high">{t('High', 'Высокий')}</option>
            <option value="urgent">{t('Urgent', 'Срочно')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-200/80 mb-2">{t('Due Date', 'Срок')}</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="cosmic-input" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="cosmic-btn cosmic-btn-primary flex-1">{t('Save', 'Сохранить')}</button>
        <button type="button" onClick={onCancel} className="cosmic-btn cosmic-btn-ghost flex-1">{t('Cancel', 'Отмена')}</button>
      </div>
    </form>
  );
}
