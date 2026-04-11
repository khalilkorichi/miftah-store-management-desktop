import React, { useState, useMemo } from 'react';
import { useNotifications } from '../NotificationContext';
import {
  PlusIcon, SearchIcon, CheckSquareIcon,
  ClockIcon, CheckCircleIcon, InboxIcon, ListIcon, GridIcon, SparklesIcon,
  EditIcon, TrashIcon
} from '../Icons';
import TaskCard, { CATEGORIES, PRIORITIES, getDaysInfo } from './TaskCard';
import TaskModal from './TaskModal';
import TaskStatsBar from './TaskStatsBar';
import TaskTemplatesModal from './TaskTemplatesModal';

const STATUS_COLS = [
  { id: 'pending',    label: 'معلّقة',        color: '#9ca3b8', Icon: InboxIcon },
  { id: 'inprogress', label: 'قيد التنفيذ',   color: '#FFC530', Icon: ClockIcon },
  { id: 'done',       label: 'مكتملة',         color: '#11BA65', Icon: CheckCircleIcon },
];

const STATUS_LABELS = { pending: 'معلّقة', inprogress: 'قيد التنفيذ', done: 'مكتملة' };

const QUICK_FILTERS = [
  { id: 'all',     label: 'الكل' },
  { id: 'today',   label: 'اليوم' },
  { id: 'week',    label: 'هذا الأسبوع' },
  { id: 'urgent',  label: 'عاجلة' },
  { id: 'overdue', label: 'متأخرة' },
];

function taskMatchesQuickFilter(task, filterId) {
  if (filterId === 'all') return true;
  if (filterId === 'urgent') return task.priority === 'urgent' && task.status !== 'done';
  if (filterId === 'overdue') {
    const info = getDaysInfo(task.dueDate, task.status);
    return info?.isOverdue === true;
  }
  if (filterId === 'today') {
    const info = getDaysInfo(task.dueDate, task.status);
    return info?.isToday === true;
  }
  if (filterId === 'week') {
    if (!task.dueDate || task.status === 'done') return false;
    const info = getDaysInfo(task.dueDate, task.status);
    if (!info) return false;
    return info.diffDays >= 0 && info.diffDays <= 7;
  }
  return true;
}

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const priorityWeight = (t) => PRIORITIES[t.priority]?.weight ?? 0;
    const pw = priorityWeight(b) - priorityWeight(a);
    if (pw !== 0) return pw;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('ar-SA', {
      month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

export default function TaskManager({ tasks, setTasks }) {
  const { addNotification } = useNotifications();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [prefillData, setPrefillData] = useState(null);
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('kanban');
  const [showTemplates, setShowTemplates] = useState(false);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) &&
            !t.description?.toLowerCase().includes(q)) return false;
      }
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (!taskMatchesQuickFilter(t, quickFilter)) return false;
      return true;
    });
  }, [tasks, search, quickFilter, filterCategory]);

  const tasksByStatus = useMemo(() => {
    const map = {};
    STATUS_COLS.forEach(c => {
      map[c.id] = sortTasks(filtered.filter(t => t.status === c.id));
    });
    return map;
  }, [filtered]);

  const handleSave = (task) => {
    const isNew = !tasks.some(t => t.id === task.id);
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === task.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = task;
        return next;
      }
      return [task, ...prev];
    });
    addNotification({ type: 'success', title: isNew ? 'تم إنشاء مهمة' : 'تم تحديث مهمة', description: `"${task.title}"`, category: 'operations', actionTab: 'operations' });
  };

  const handleDelete = (id) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (task) addNotification({ type: 'warning', title: 'تم حذف مهمة', description: `"${task.title}"`, category: 'operations', actionTab: 'operations' });
  };

  const STATUS_LABELS = { pending: 'قيد الانتظار', in_progress: 'قيد التنفيذ', done: 'مكتملة' };
  const handleStatusChange = (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
      : t
    ));
    const task = tasks.find(t => t.id === id);
    if (task) addNotification({ type: newStatus === 'done' ? 'success' : 'info', title: 'تم تغيير حالة المهمة', description: `"${task.title}" → ${STATUS_LABELS[newStatus] || newStatus}`, category: 'operations', actionTab: 'operations' });
  };

  const openEdit = (task) => { setEditingTask(task); setPrefillData(null); setShowModal(true); };
  const openNewEmpty = () => { setEditingTask(null); setPrefillData(null); setShowModal(true); };

  const handleTemplateSelect = (tplData) => {
    setEditingTask(null);
    setPrefillData(tplData);
    setShowModal(true);
  };

  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;

  return (
    <div className="task-manager">
      <TaskStatsBar tasks={tasks} />

      {/* Quick filters */}
      <div className="task-quick-filters">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.id}
            className={`task-qf-btn ${quickFilter === f.id ? 'task-qf-active' : ''}`}
            onClick={() => setQuickFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ops-toolbar">
        <div className="ops-search-wrap">
          <SearchIcon className="icon-sm ops-search-icon" />
          <input
            type="text"
            className="ops-search-input"
            placeholder="بحث في المهام..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ops-filters">
          <select
            className="ops-filter-select"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="all">كل التصنيفات</option>
            {Object.entries(CATEGORIES).map(([id, c]) => (
              <option key={id} value={id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div className="task-view-toggle">
          <button
            className={`task-view-btn ${viewMode === 'kanban' ? 'task-view-active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="عرض كانبان"
          >
            <GridIcon className="icon-sm" />
          </button>
          <button
            className={`task-view-btn ${viewMode === 'list' ? 'task-view-active' : ''}`}
            onClick={() => setViewMode('list')}
            title="عرض قائمة"
          >
            <ListIcon className="icon-sm" />
          </button>
        </div>

        <button
          className="ops-btn ops-btn-secondary"
          onClick={() => setShowTemplates(true)}
          title="قوالب المهام"
        >
          <SparklesIcon className="icon-sm" /> قوالب
        </button>

        <button className="ops-btn ops-btn-primary ops-add-btn" onClick={openNewEmpty}>
          <PlusIcon className="icon-sm" /> مهمة جديدة
        </button>
      </div>

      {urgentCount > 0 && (
        <div className="task-urgent-banner">
          <span className="task-urgent-dot" />
          لديك <strong>{urgentCount}</strong> {urgentCount === 1 ? 'مهمة عاجلة' : 'مهام عاجلة'} تحتاج انتباهك الآن
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="task-kanban">
          {STATUS_COLS.map(col => (
            <div key={col.id} className={`task-col task-col-${col.id}`}>
              <div className="task-col-header" style={{ '--col-color': col.color }}>
                <col.Icon className="icon-sm" />
                <span className="task-col-label">{col.label}</span>
                <span className="task-col-count">{tasksByStatus[col.id].length}</span>
              </div>
              <div className="task-col-body">
                {tasksByStatus[col.id].length === 0 ? (
                  <div className="task-col-empty">
                    <CheckSquareIcon className="icon-lg" />
                    <span>لا توجد مهام</span>
                  </div>
                ) : (
                  tasksByStatus[col.id].map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="task-list-view">
          {sortTasks(filtered).length === 0 ? (
            <div className="unified-empty">
              <div className="unified-empty-icon"><CheckSquareIcon className="icon-xl" /></div>
              <h4>لا توجد مهام</h4>
              <p>أضف مهمة جديدة أو جرّب تغيير الفلتر</p>
            </div>
          ) : (
            <table className="task-list-table">
              <thead>
                <tr>
                  <th>المهمة</th>
                  <th>الأولوية</th>
                  <th>الحالة</th>
                  <th>التصنيف</th>
                  <th>تاريخ الاستحقاق</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortTasks(filtered).map(task => {
                  const pri = PRIORITIES[task.priority];
                  const cat = CATEGORIES[task.category];
                  const daysInfo = getDaysInfo(task.dueDate, task.status);
                  return (
                    <tr key={task.id} className={`task-list-row task-list-row-${task.status}`}>
                      <td className="task-list-title">
                        <span className="task-list-title-text">{task.title}</span>
                        {task.description && (
                          <span className="task-list-desc">{task.description}</span>
                        )}
                      </td>
                      <td>
                        {pri && (
                          <span className="task-list-badge" style={{ '--badge-bg': pri.color + '25', '--badge-color': pri.color }}>
                            {pri.label}
                          </span>
                        )}
                      </td>
                      <td>
                        <select
                          className="task-list-status-sel"
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value)}
                        >
                          {STATUS_COLS.map(s => (
                            <option key={s.id} value={s.id}>{STATUS_LABELS[s.id]}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {cat && (
                          <span className="task-list-badge" style={{ '--badge-bg': cat.color + '22', '--badge-color': cat.color }}>
                            {cat.icon} {cat.label}
                          </span>
                        )}
                      </td>
                      <td className="task-list-date">
                        {task.dueDate ? (
                          <span className={daysInfo?.isOverdue ? 'task-list-overdue' : ''}>
                            {formatShortDate(task.dueDate)}
                            {daysInfo?.isOverdue && <span className="task-list-overdue-badge"> (متأخر)</span>}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="task-list-actions">
                        <button className="task-action-btn" onClick={() => openEdit(task)} title="تعديل">
                          <EditIcon className="icon-sm" />
                        </button>
                        <button className="task-action-btn task-delete-btn" onClick={() => handleDelete(task.id)} title="حذف">
                          <TrashIcon className="icon-sm" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editingTask}
          prefillData={prefillData}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingTask(null); setPrefillData(null); }}
        />
      )}

      {showTemplates && (
        <TaskTemplatesModal
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
