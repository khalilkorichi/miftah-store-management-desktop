import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, CheckIcon, FlagIcon, CalendarIcon, TagIcon, ClockIcon } from '../Icons';

const CATEGORIES = [
  { id: 'ops', label: 'تشغيل', color: '#5E4FDE' },
  { id: 'admin', label: 'إداري', color: '#1A51F4' },
  { id: 'support', label: 'دعم عملاء', color: '#11BA65' },
  { id: 'inventory', label: 'مخزون', color: '#F7784A' },
  { id: 'marketing', label: 'تسويق', color: '#FFC530' },
  { id: 'other', label: 'أخرى', color: '#9ca3b8' },
];

const PRIORITIES = [
  { id: 'normal', label: 'عادية', color: '#9ca3b8' },
  { id: 'medium', label: 'متوسطة', color: '#FFC530' },
  { id: 'high', label: 'عالية', color: '#F7784A' },
  { id: 'urgent', label: 'عاجلة', color: '#F94B60' },
];

export default function TaskModal({ task, prefillData, onSave, onClose }) {
  const isEdit = !!task;
  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);

  const [form, setForm] = useState({
    title: task?.title || prefillData?.title || '',
    description: task?.description || prefillData?.description || '',
    category: task?.category || prefillData?.category || 'ops',
    priority: task?.priority || prefillData?.priority || 'normal',
    status: task?.status || prefillData?.status || 'pending',
    dueDate: task?.dueDate || prefillData?.dueDate || '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    firstInputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'العنوان مطلوب';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const now = new Date().toISOString();
    onSave({
      id: task?.id || `task_${Date.now()}`,
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      createdAt: task?.createdAt || now,
      updatedAt: now,
    });
    onClose();
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const modalRoot = document.getElementById('modal-root') || document.body;
  return createPortal(
    <div
      className="ops-modal-overlay"
      ref={overlayRef}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'تعديل المهمة' : 'مهمة جديدة'}
    >
      <div className="ops-modal">
        <div className="ops-modal-header">
          <h2 className="ops-modal-title">
            <FlagIcon className="icon-sm" />
            {isEdit ? 'تعديل المهمة' : 'مهمة جديدة'}
          </h2>
          <button className="ops-modal-close" onClick={onClose} aria-label="إغلاق">
            <XIcon className="icon-sm" />
          </button>
        </div>

        <form className="ops-modal-body" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="ops-form-group">
            <label className="ops-form-label">العنوان <span className="ops-required">*</span></label>
            <input
              ref={firstInputRef}
              type="text"
              className={`ops-form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="عنوان المهمة..."
              value={form.title}
              onChange={e => { set('title', e.target.value); setErrors(v => ({ ...v, title: '' })); }}
            />
            {errors.title && <span className="ops-form-error">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="ops-form-group">
            <label className="ops-form-label">الوصف (اختياري)</label>
            <textarea
              className="ops-form-textarea"
              placeholder="تفاصيل المهمة..."
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          <div className="ops-form-row">
            {/* Category */}
            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label"><TagIcon className="icon-xs" /> التصنيف</label>
              <div className="ops-chip-group">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`ops-chip ${form.category === c.id ? 'ops-chip-selected' : ''}`}
                    style={{ '--chip-color': c.color }}
                    onClick={() => set('category', c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label"><FlagIcon className="icon-xs" /> الأولوية</label>
              <div className="ops-chip-group">
                {PRIORITIES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`ops-chip ${form.priority === p.id ? 'ops-chip-selected' : ''}`}
                    style={{ '--chip-color': p.color }}
                    onClick={() => set('priority', p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ops-form-row">
            {/* Due date */}
            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label"><CalendarIcon className="icon-xs" /> الموعد النهائي</label>
              <input
                type="date"
                className="ops-form-input"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label"><ClockIcon className="icon-xs" /> الحالة</label>
              <select
                className="ops-form-select"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                <option value="pending">معلّقة</option>
                <option value="inprogress">قيد التنفيذ</option>
                <option value="done">مكتملة</option>
              </select>
            </div>
          </div>

          <div className="ops-modal-footer">
            <button type="button" className="ops-btn ops-btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="ops-btn ops-btn-primary">
              <CheckIcon className="icon-sm" /> {isEdit ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    modalRoot
  );
}
