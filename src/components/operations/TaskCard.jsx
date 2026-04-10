import React, { useState } from 'react';
import {
  ChevronDownIcon, ChevronUpIcon, EditIcon, TrashIcon,
  CheckCircleIcon, ClockIcon, FlagIcon, TagIcon, CalendarIcon
} from '../Icons';

export const CATEGORIES = {
  ops: { label: 'تشغيل', color: '#5E4FDE' },
  admin: { label: 'إداري', color: '#1A51F4' },
  support: { label: 'دعم عملاء', color: '#11BA65' },
  inventory: { label: 'مخزون', color: '#F7784A' },
  marketing: { label: 'تسويق', color: '#FFC530' },
  other: { label: 'أخرى', color: '#9ca3b8' },
};

export const PRIORITIES = {
  normal: { label: 'عادية', color: '#9ca3b8', weight: 0 },
  medium: { label: 'متوسطة', color: '#FFC530', weight: 1 },
  high: { label: 'عالية', color: '#F7784A', weight: 2 },
  urgent: { label: 'عاجلة', color: '#F94B60', weight: 3 },
};

export function getDaysInfo(dueDate, status) {
  if (!dueDate || status === 'done') return null;
  const n = new Date();
  const todayMs = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  const [year, month, day] = dueDate.split('-').map(Number);
  const dueMs = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
  return { diffDays, isOverdue: diffDays < 0, isToday: diffDays === 0 };
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch { return dateStr; }
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITIES[task.priority] || PRIORITIES.normal;
  const category = CATEGORIES[task.category] || CATEGORIES.other;
  const daysInfo = getDaysInfo(task.dueDate, task.status);
  const overdue = daysInfo?.isOverdue;

  const statusCycle = { pending: 'inprogress', inprogress: 'done', done: 'pending' };

  function renderDaysLabel() {
    if (!daysInfo) return null;
    if (daysInfo.isOverdue) return (
      <span className="task-overdue-badge">متأخرة ({Math.abs(daysInfo.diffDays)} يوم)</span>
    );
    if (daysInfo.isToday) return (
      <span className="task-today-badge">اليوم</span>
    );
    return (
      <span className="task-days-badge">
        <CalendarIcon className="icon-xs" />
        {daysInfo.diffDays === 1 ? 'غداً' : `${daysInfo.diffDays} يوم`}
      </span>
    );
  }

  return (
    <div
      className={`task-card priority-${task.priority} status-${task.status} ${overdue ? 'task-overdue' : ''}`}
      style={{ '--priority-color': priority.color }}
    >
      <div className="task-card-header" onClick={() => setExpanded(v => !v)}>
        <div className="task-card-left">
          <button
            className={`task-status-btn status-${task.status}`}
            onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, statusCycle[task.status]); }}
            title="تغيير الحالة"
            aria-label="تغيير الحالة"
          >
            {task.status === 'done' ? <CheckCircleIcon className="icon-sm" /> :
             task.status === 'inprogress' ? <ClockIcon className="icon-sm" /> :
             <span className="task-status-dot" />}
          </button>
          <div className="task-card-info">
            <span className={`task-card-title ${task.status === 'done' ? 'task-done-title' : ''}`}>
              {task.title}
            </span>
            <div className="task-card-meta">
              <span className="task-cat-badge" style={{ '--cat-color': category.color }}>
                <TagIcon className="icon-xs" /> {category.label}
              </span>
              <span className="task-pri-badge" style={{ '--pri-color': priority.color }}>
                <FlagIcon className="icon-xs" /> {priority.label}
              </span>
              {task.dueDate && renderDaysLabel()}
              {task.priority === 'urgent' && task.status !== 'done' && (
                <span className="task-urgent-pulse" />
              )}
            </div>
          </div>
        </div>
        <div className="task-card-actions" onClick={e => e.stopPropagation()}>
          <button className="task-action-btn" onClick={() => onEdit(task)} title="تعديل">
            <EditIcon className="icon-sm" />
          </button>
          <button className="task-action-btn task-delete-btn" onClick={() => onDelete(task.id)} title="حذف">
            <TrashIcon className="icon-sm" />
          </button>
          <button className="task-expand-btn" onClick={() => setExpanded(v => !v)} aria-label="توسيع">
            {expanded ? <ChevronUpIcon className="icon-sm" /> : <ChevronDownIcon className="icon-sm" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="task-card-body">
          {task.description ? (
            <p className="task-description">{task.description}</p>
          ) : (
            <p className="task-no-desc">لا يوجد وصف</p>
          )}
          <div className="task-card-footer">
            <span className="task-created-at">
              أُنشئت: {formatDate(task.createdAt?.split('T')[0])}
            </span>
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <span className="task-updated-at">
                آخر تعديل: {formatDate(task.updatedAt?.split('T')[0])}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
