import React, { useMemo } from 'react';
import { CheckCircleIcon, ClockIcon, AlertTriangleIcon, FlagIcon } from '../Icons';
import { getDaysInfo } from './TaskCard';

export default function TaskStatsBar({ tasks }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const overdue = tasks.filter(t => {
      const info = getDaysInfo(t.dueDate, t.status);
      return info?.isOverdue === true;
    }).length;
    const today = tasks.filter(t => {
      const info = getDaysInfo(t.dueDate, t.status);
      return info?.isToday === true;
    }).length;
    const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    return { total, done, pct, overdue, today, urgent };
  }, [tasks]);

  if (stats.total === 0) return null;

  return (
    <div className="task-stats-bar">
      <div className="task-stats-progress-wrap">
        <div className="task-stats-progress-header">
          <span className="task-stats-progress-label">
            <CheckCircleIcon className="icon-xs" />
            الإنجاز الإجمالي
          </span>
          <span className="task-stats-progress-pct">{stats.pct}%</span>
        </div>
        <div className="task-stats-progress-track">
          <div
            className="task-stats-progress-fill"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
        <span className="task-stats-progress-count">{stats.done} / {stats.total} مهمة</span>
      </div>

      <div className="task-stats-counters">
        <div className="task-stats-counter task-stats-counter-today">
          <ClockIcon className="icon-xs" />
          <span className="task-stats-counter-val">{stats.today}</span>
          <span className="task-stats-counter-lbl">اليوم</span>
        </div>
        <div className={`task-stats-counter ${stats.overdue > 0 ? 'task-stats-counter-overdue' : 'task-stats-counter-ok'}`}>
          <AlertTriangleIcon className="icon-xs" />
          <span className="task-stats-counter-val">{stats.overdue}</span>
          <span className="task-stats-counter-lbl">متأخرة</span>
        </div>
        <div className={`task-stats-counter ${stats.urgent > 0 ? 'task-stats-counter-urgent' : 'task-stats-counter-ok'}`}>
          <FlagIcon className="icon-xs" />
          <span className="task-stats-counter-val">{stats.urgent}</span>
          <span className="task-stats-counter-lbl">عاجلة</span>
        </div>
      </div>
    </div>
  );
}
