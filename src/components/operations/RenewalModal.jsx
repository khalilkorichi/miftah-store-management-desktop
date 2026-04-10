import React, { useState, useEffect, useRef } from 'react';
import { XIcon, CheckIcon, CalendarIcon, TagIcon, DollarSignIcon } from '../Icons';

const RENEWAL_CYCLES = [
  { id: 'month_1', label: 'شهري' },
  { id: 'month_3', label: 'ربع سنوي (3 أشهر)' },
  { id: 'month_6', label: 'نصف سنوي (6 أشهر)' },
  { id: 'month_12', label: 'سنوي' },
];

export default function RenewalModal({ renewal, products, suppliers, onSave, onClose }) {
  const isEdit = !!renewal;
  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    productId: renewal?.productId || '',
    supplierId: renewal?.supplierId || '',
    renewalDate: renewal?.renewalDate || today,
    costUsd: renewal?.costUsd ?? '',
    cycle: renewal?.cycle || 'month_1',
    notes: renewal?.notes || '',
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
    if (!form.productId) e.productId = 'المنتج مطلوب';
    if (!form.renewalDate) e.renewalDate = 'تاريخ التجديد مطلوب';
    if (form.costUsd !== '' && isNaN(parseFloat(form.costUsd))) e.costUsd = 'تكلفة غير صحيحة';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const now = new Date().toISOString();
    onSave({
      id: renewal?.id || `renew_${Date.now()}`,
      productId: form.productId,
      supplierId: form.supplierId,
      renewalDate: form.renewalDate,
      costUsd: form.costUsd !== '' ? parseFloat(form.costUsd) : null,
      cycle: form.cycle,
      notes: form.notes.trim(),
      createdAt: renewal?.createdAt || now,
      updatedAt: now,
      archived: false,
    });
    onClose();
  };

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(v => ({ ...v, [key]: '' })); };

  return (
    <div
      className="ops-modal-overlay"
      ref={overlayRef}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="ops-modal">
        <div className="ops-modal-header">
          <h2 className="ops-modal-title">
            <CalendarIcon className="icon-sm" />
            {isEdit ? 'تعديل تذكير التجديد' : 'تذكير تجديد جديد'}
          </h2>
          <button className="ops-modal-close" onClick={onClose} aria-label="إغلاق">
            <XIcon className="icon-sm" />
          </button>
        </div>

        <form className="ops-modal-body" onSubmit={handleSubmit} noValidate>
          <div className="ops-form-row">
            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label">
                <TagIcon className="icon-xs" /> المنتج <span className="ops-required">*</span>
              </label>
              <select
                ref={firstInputRef}
                className={`ops-form-select ${errors.productId ? 'input-error' : ''}`}
                value={form.productId}
                onChange={e => set('productId', e.target.value)}
              >
                <option value="">-- اختر منتجاً --</option>
                {products.map(p => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </select>
              {errors.productId && <span className="ops-form-error">{errors.productId}</span>}
            </div>

            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label">
                <TagIcon className="icon-xs" /> المورد
              </label>
              <select
                className="ops-form-select"
                value={form.supplierId}
                onChange={e => set('supplierId', e.target.value)}
              >
                <option value="">-- اختر مورداً (اختياري) --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ops-form-row">
            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label">
                <CalendarIcon className="icon-xs" /> تاريخ التجديد <span className="ops-required">*</span>
              </label>
              <input
                type="date"
                className={`ops-form-input ${errors.renewalDate ? 'input-error' : ''}`}
                value={form.renewalDate}
                onChange={e => set('renewalDate', e.target.value)}
              />
              {errors.renewalDate && <span className="ops-form-error">{errors.renewalDate}</span>}
            </div>

            <div className="ops-form-group ops-form-half">
              <label className="ops-form-label">دورة التجديد</label>
              <select
                className="ops-form-select"
                value={form.cycle}
                onChange={e => set('cycle', e.target.value)}
              >
                {RENEWAL_CYCLES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ops-form-group">
            <label className="ops-form-label">
              <DollarSignIcon className="icon-xs" /> التكلفة (بالدولار USD)
            </label>
            <input
              type="number"
              className={`ops-form-input ${errors.costUsd ? 'input-error' : ''}`}
              placeholder="مثال: 20.00"
              value={form.costUsd}
              onChange={e => set('costUsd', e.target.value)}
              step="0.01"
              min="0"
              dir="ltr"
            />
            {errors.costUsd && <span className="ops-form-error">{errors.costUsd}</span>}
          </div>

          <div className="ops-form-group">
            <label className="ops-form-label">ملاحظات (اختياري)</label>
            <textarea
              className="ops-form-textarea"
              placeholder="أي ملاحظات إضافية عن التجديد..."
              rows={2}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          <div className="ops-modal-footer">
            <button type="button" className="ops-btn ops-btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="ops-btn ops-btn-primary">
              <CheckIcon className="icon-sm" /> {isEdit ? 'حفظ التعديلات' : 'إضافة التذكير'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
