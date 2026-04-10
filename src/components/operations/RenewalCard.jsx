import React from 'react';
import {
  CalendarIcon, EditIcon, TrashIcon, CheckCircleIcon,
  AlertTriangleIcon, ClockIcon, DollarSignIcon, TagIcon
} from '../Icons';

function getRenewalDaysInfo(renewalDate) {
  if (!renewalDate) return null;
  const n = new Date();
  const todayMs = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  const [year, month, day] = renewalDate.split('-').map(Number);
  const dueMs = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));
  return {
    diffDays,
    isOverdue: diffDays < 0,
    isToday: diffDays === 0,
    isThisWeek: diffDays > 0 && diffDays <= 7,
    isThisMonth: diffDays > 0 && diffDays <= 30,
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

const CYCLE_MONTHS = { month_1: 1, month_3: 3, month_6: 6, month_12: 12 };

export { getRenewalDaysInfo };

export default function RenewalCard({
  renewal, productName, supplierName, exchangeRate, onEdit, onDelete, onRenewed,
}) {
  const info = getRenewalDaysInfo(renewal.renewalDate);
  const costSar = renewal.costUsd != null ? (renewal.costUsd * exchangeRate).toFixed(2) : null;

  function handleRenewed() {
    const months = CYCLE_MONTHS[renewal.cycle] || 1;
    const [y, m, d] = renewal.renewalDate.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1 + months, d));
    const nextStr = next.toISOString().split('T')[0];
    onRenewed(renewal.id, nextStr);
  }

  function urgencyClass() {
    if (!info) return '';
    if (info.isOverdue) return 'renewal-card-overdue';
    if (info.isToday) return 'renewal-card-today';
    if (info.isThisWeek) return 'renewal-card-week';
    return '';
  }

  function renderBadge() {
    if (!info) return null;
    if (info.isOverdue) return (
      <span className="renewal-days-badge renewal-badge-overdue">
        <AlertTriangleIcon className="icon-xs" />
        متأخر {Math.abs(info.diffDays)} يوم
      </span>
    );
    if (info.isToday) return (
      <span className="renewal-days-badge renewal-badge-today">
        <ClockIcon className="icon-xs" />
        اليوم!
      </span>
    );
    if (info.isThisWeek) return (
      <span className="renewal-days-badge renewal-badge-week">
        <CalendarIcon className="icon-xs" />
        {info.diffDays === 1 ? 'غداً' : `${info.diffDays} أيام`}
      </span>
    );
    return (
      <span className="renewal-days-badge renewal-badge-future">
        <CalendarIcon className="icon-xs" />
        {info.diffDays} يوم
      </span>
    );
  }

  return (
    <div className={`renewal-card ${urgencyClass()}`}>
      <div className="renewal-card-left">
        <div className="renewal-card-name">
          <TagIcon className="icon-xs" />
          {productName || 'منتج غير معروف'}
        </div>
        {supplierName && (
          <div className="renewal-card-supplier">المورد: {supplierName}</div>
        )}
        {renewal.notes && (
          <div className="renewal-card-notes">{renewal.notes}</div>
        )}
      </div>

      <div className="renewal-card-center">
        <div className="renewal-card-date">
          <CalendarIcon className="icon-xs" />
          {formatDate(renewal.renewalDate)}
        </div>
        {renderBadge()}
      </div>

      <div className="renewal-card-right">
        {renewal.costUsd != null && (
          <div className="renewal-card-cost">
            <span className="renewal-cost-usd">
              <DollarSignIcon className="icon-xs" />
              {renewal.costUsd} USD
            </span>
            {costSar && (
              <span className="renewal-cost-sar">≈ {costSar} SAR</span>
            )}
          </div>
        )}
        <div className="renewal-card-actions">
          <button
            className="renewal-btn renewal-btn-done"
            onClick={handleRenewed}
            title="تم التجديد — تحديث للتاريخ التالي"
          >
            <CheckCircleIcon className="icon-xs" />
            تم التجديد
          </button>
          <button className="task-action-btn" onClick={() => onEdit(renewal)} title="تعديل">
            <EditIcon className="icon-sm" />
          </button>
          <button className="task-action-btn task-delete-btn" onClick={() => onDelete(renewal.id)} title="حذف">
            <TrashIcon className="icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
