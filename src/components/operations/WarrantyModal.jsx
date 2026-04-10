import React, { useState, useEffect, useRef } from 'react';
import {
  XIcon, CheckIcon, ShieldCheckIcon, UserIcon, TagIcon,
  CalendarIcon, ClockIcon, MessageCircleIcon, SendIcon, InfoIcon
} from '../Icons';

export default function WarrantyModal({ warranty, products, suppliers, durations, onSave, onClose }) {
  const isEdit = !!warranty;
  const overlayRef = useRef(null);
  const firstInputRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    customerName: warranty?.customerName || '',
    customerWhatsapp: warranty?.customerWhatsapp || '',
    productId: warranty?.productId || '',
    planId: warranty?.planId ?? '',
    supplierId: warranty?.supplierId || '',
    purchaseDate: warranty?.purchaseDate || today,
    subscriptionStartDate: warranty?.subscriptionStartDate || today,
    subscriptionEndDate: warranty?.subscriptionEndDate || '',
    warrantyType: warranty?.warrantyType || 'subscription',
    warrantyDays: warranty?.warrantyDays ?? '',
  });
  const [errors, setErrors] = useState({});
  const [autoFilledWarranty, setAutoFilledWarranty] = useState(null);

  const selectedSupplier = suppliers.find(s => String(s.id) === String(form.supplierId));
  const selectedProduct = products.find(p => String(p.id) === String(form.productId));
  const productPlans = selectedProduct?.plans || [];
  const selectedPlan = productPlans.find(pl => String(pl.id) === String(form.planId));

  const getDurationLabel = (durationId) => {
    const dur = (durations || []).find(d => d.id === durationId);
    return dur?.label || durationId;
  };

  useEffect(() => {
    firstInputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isEdit) {
      setForm(f => ({ ...f, planId: '' }));
      setAutoFilledWarranty(null);
    }
  }, [form.productId]);

  useEffect(() => {
    if (!selectedPlan) {
      setAutoFilledWarranty(null);
      return;
    }
    const days = selectedPlan.warrantyDays;
    if (days && days > 0) {
      setForm(f => ({ ...f, warrantyType: 'days', warrantyDays: String(days) }));
      setAutoFilledWarranty(days);
    } else {
      setAutoFilledWarranty(null);
    }
  }, [form.planId]);

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'اسم العميل مطلوب';
    if (!form.productId) e.productId = 'المنتج مطلوب';
    if (!form.purchaseDate) e.purchaseDate = 'تاريخ الشراء مطلوب';
    if (!form.subscriptionStartDate) e.subscriptionStartDate = 'تاريخ بداية الاشتراك مطلوب';
    if (form.warrantyType === 'subscription' && !form.subscriptionEndDate) {
      e.subscriptionEndDate = 'تاريخ نهاية الاشتراك مطلوب';
    }
    if (form.warrantyType === 'days') {
      const d = Number(form.warrantyDays);
      if (!form.warrantyDays || isNaN(d) || d <= 0) e.warrantyDays = 'أدخل عدد أيام صحيح';
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const now = new Date().toISOString();
    onSave({
      id: warranty?.id || `warranty_${Date.now()}`,
      customerName: form.customerName.trim(),
      customerWhatsapp: form.customerWhatsapp.trim(),
      productId: form.productId,
      planId: form.planId !== '' ? Number(form.planId) : null,
      supplierId: form.supplierId,
      purchaseDate: form.purchaseDate,
      subscriptionStartDate: form.subscriptionStartDate,
      subscriptionEndDate: form.warrantyType === 'subscription' ? form.subscriptionEndDate : '',
      warrantyType: form.warrantyType,
      warrantyDays: form.warrantyType === 'days' ? Number(form.warrantyDays) : null,
      createdAt: warranty?.createdAt || now,
      updatedAt: now,
    });
    onClose();
  };

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(v => ({ ...v, [key]: '' }));
  };

  return (
    <div
      className="ops-modal-overlay"
      ref={overlayRef}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="ops-modal warranty-modal">
        <div className="ops-modal-header">
          <h2 className="ops-modal-title">
            <ShieldCheckIcon className="icon-sm" />
            {isEdit ? 'تعديل سجل الضمان' : 'إضافة سجل ضمان جديد'}
          </h2>
          <button className="ops-modal-close" onClick={onClose} aria-label="إغلاق">
            <XIcon className="icon-sm" />
          </button>
        </div>

        <form className="ops-modal-body warranty-modal-form" onSubmit={handleSubmit} noValidate>
          <div className="warranty-modal-scroll">

          {/* ── Section 1: Customer ── */}
          <div className="warranty-section">
            <div className="warranty-section-title">
              <UserIcon className="icon-xs" />
              <span>معلومات العميل</span>
            </div>
            <div className="ops-form-row">
              <div className="ops-form-group ops-form-half">
                <label className="ops-form-label">
                  الاسم <span className="ops-required">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  className={`ops-form-input ${errors.customerName ? 'input-error' : ''}`}
                  placeholder="مثال: أحمد محمد"
                  value={form.customerName}
                  onChange={e => set('customerName', e.target.value)}
                />
                {errors.customerName && <span className="ops-form-error">{errors.customerName}</span>}
              </div>
              <div className="ops-form-group ops-form-half">
                <label className="ops-form-label">
                  <MessageCircleIcon className="icon-xs" /> واتساب العميل
                </label>
                <input
                  type="text"
                  className="ops-form-input"
                  placeholder="مثال: 966501234567"
                  value={form.customerWhatsapp}
                  onChange={e => set('customerWhatsapp', e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Product & Supplier ── */}
          <div className="warranty-section">
            <div className="warranty-section-title">
              <TagIcon className="icon-xs" />
              <span>المنتج والمورد</span>
            </div>
            <div className="ops-form-row">
              <div className="ops-form-group ops-form-half">
                <label className="ops-form-label">
                  المنتج <span className="ops-required">*</span>
                </label>
                <select
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
                  <CalendarIcon className="icon-xs" /> خطة المنتج
                </label>
                <select
                  className="ops-form-select"
                  value={form.planId}
                  onChange={e => set('planId', e.target.value)}
                  disabled={productPlans.length === 0}
                >
                  <option value="">
                    {productPlans.length === 0 ? '-- اختر منتجاً أولاً --' : '-- اختر الخطة (اختياري) --'}
                  </option>
                  {productPlans.map(plan => (
                    <option key={plan.id} value={String(plan.id)}>
                      {getDurationLabel(plan.durationId)}
                      {plan.warrantyDays > 0 ? ` — ضمان ${plan.warrantyDays} يوم` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {autoFilledWarranty && (
              <div className="warranty-autofill-banner">
                <ShieldCheckIcon className="icon-xs" />
                <span>تم تعيين الضمان تلقائياً من بيانات المنتج: <strong>{autoFilledWarranty} يوم</strong></span>
              </div>
            )}

            <div className="ops-form-row">
              <div className="ops-form-group ops-form-half">
                <label className="ops-form-label">
                  <ShieldCheckIcon className="icon-xs" /> المورد
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
              {selectedSupplier && (selectedSupplier.whatsapp || selectedSupplier.telegram) && (
                <div className="ops-form-group ops-form-half warranty-supplier-contact-col">
                  <label className="ops-form-label">تواصل مع المورد</label>
                  <div className="warranty-supplier-contact-row">
                    {selectedSupplier.whatsapp && (
                      <a
                        href={`https://wa.me/${selectedSupplier.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="warranty-contact-pill warranty-contact-wa"
                      >
                        <MessageCircleIcon className="icon-xs" />
                        واتساب
                      </a>
                    )}
                    {selectedSupplier.telegram && (
                      <a
                        href={`https://t.me/${selectedSupplier.telegram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="warranty-contact-pill warranty-contact-tg"
                      >
                        <SendIcon className="icon-xs" />
                        تيليجرام
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Dates ── */}
          <div className="warranty-section">
            <div className="warranty-section-title">
              <CalendarIcon className="icon-xs" />
              <span>تواريخ الاشتراك</span>
            </div>
            <div className="ops-form-row">
              <div className="ops-form-group ops-form-half">
                <label className="ops-form-label">
                  تاريخ الشراء <span className="ops-required">*</span>
                </label>
                <input
                  type="date"
                  className={`ops-form-input ${errors.purchaseDate ? 'input-error' : ''}`}
                  value={form.purchaseDate}
                  onChange={e => set('purchaseDate', e.target.value)}
                />
                {errors.purchaseDate && <span className="ops-form-error">{errors.purchaseDate}</span>}
              </div>
              <div className="ops-form-group ops-form-half">
                <label className="ops-form-label">
                  تاريخ بداية الاشتراك <span className="ops-required">*</span>
                </label>
                <input
                  type="date"
                  className={`ops-form-input ${errors.subscriptionStartDate ? 'input-error' : ''}`}
                  value={form.subscriptionStartDate}
                  onChange={e => set('subscriptionStartDate', e.target.value)}
                />
                {errors.subscriptionStartDate && <span className="ops-form-error">{errors.subscriptionStartDate}</span>}
              </div>
            </div>
          </div>

          {/* ── Section 4: Warranty Config ── */}
          <div className="warranty-section">
            <div className="warranty-section-title">
              <ShieldCheckIcon className="icon-xs" />
              <span>إعدادات الضمان</span>
            </div>
            <div className="ops-form-group">
              <label className="ops-form-label">
                نوع الضمان <span className="ops-required">*</span>
              </label>
              <div className="warranty-type-toggle">
                <button
                  type="button"
                  className={`warranty-type-btn ${form.warrantyType === 'subscription' ? 'warranty-type-active' : ''}`}
                  onClick={() => set('warrantyType', 'subscription')}
                >
                  طوال مدة الاشتراك
                </button>
                <button
                  type="button"
                  className={`warranty-type-btn ${form.warrantyType === 'days' ? 'warranty-type-active' : ''}`}
                  onClick={() => set('warrantyType', 'days')}
                >
                  مدة محددة بالأيام
                </button>
              </div>
            </div>

            {form.warrantyType === 'subscription' ? (
              <div className="ops-form-group">
                <label className="ops-form-label">
                  تاريخ نهاية الاشتراك <span className="ops-required">*</span>
                </label>
                <input
                  type="date"
                  className={`ops-form-input ${errors.subscriptionEndDate ? 'input-error' : ''}`}
                  value={form.subscriptionEndDate}
                  onChange={e => set('subscriptionEndDate', e.target.value)}
                />
                {errors.subscriptionEndDate && <span className="ops-form-error">{errors.subscriptionEndDate}</span>}
                <p className="warranty-type-hint">
                  <InfoIcon className="icon-xs" />
                  ينتهي الضمان تلقائياً عند انتهاء الاشتراك
                </p>
              </div>
            ) : (
              <div className="ops-form-group">
                <label className="ops-form-label">
                  عدد أيام الضمان <span className="ops-required">*</span>
                </label>
                <div className="warranty-days-input-wrap">
                  <input
                    type="number"
                    className={`ops-form-input warranty-days-input ${errors.warrantyDays ? 'input-error' : ''}`}
                    placeholder="مثال: 30"
                    value={form.warrantyDays}
                    onChange={e => { set('warrantyDays', e.target.value); setAutoFilledWarranty(null); }}
                    min="1"
                    dir="ltr"
                  />
                  <span className="warranty-days-unit">يوم</span>
                </div>
                <div className="warranty-days-presets">
                  {[{ label: 'شهر', days: 30 }, { label: 'ستة أشهر', days: 180 }, { label: 'سنة', days: 365 }].map(p => (
                    <button
                      key={p.days}
                      type="button"
                      className={`warranty-preset-btn ${Number(form.warrantyDays) === p.days ? 'warranty-preset-active' : ''}`}
                      onClick={() => { set('warrantyDays', String(p.days)); setAutoFilledWarranty(null); }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {errors.warrantyDays && <span className="ops-form-error">{errors.warrantyDays}</span>}
                {form.purchaseDate && form.warrantyDays > 0 && (() => {
                  try {
                    const [y, m, d] = form.purchaseDate.split('-').map(Number);
                    const end = new Date(Date.UTC(y, m - 1, d + Number(form.warrantyDays)));
                    const label = end.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
                    return (
                      <p className="warranty-type-hint warranty-type-hint-green">
                        <ShieldCheckIcon className="icon-xs" />
                        ينتهي الضمان بتاريخ: <strong>{label}</strong>
                      </p>
                    );
                  } catch { return null; }
                })()}
              </div>
            )}
          </div>

          </div>

          <div className="ops-modal-footer">
            <button type="button" className="ops-btn ops-btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="ops-btn ops-btn-primary">
              <CheckIcon className="icon-sm" /> {isEdit ? 'حفظ التعديلات' : 'إضافة الضمان'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
