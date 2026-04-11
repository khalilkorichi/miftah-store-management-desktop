import React, { useState, useEffect, useRef } from 'react';
import {
  PackageIcon, XIcon, CheckIcon, CheckCircleIcon,
  TagIcon, CalendarIcon, ZapIcon, UserIcon,
  PlusIcon, TrashIcon, GitBranchIcon, ChevronDownIcon, ChevronLeftIcon
} from './Icons';


function makeBranch(id, defaultDurations = ['month_1']) {
  return {
    _id: id,
    name: '',
    nameError: '',
    selectedDurations: defaultDurations,
    selectedMethods: [],
    accountType: 'none',
    categoryId: null,
    prices: {},
    warranties: {},
    expanded: true,
  };
}

function BranchForm({ branch, index, durations, suppliers, allMethods, categories, onUpdate, onRemove, canRemove }) {
  const nameRef = useRef(null);

  useEffect(() => {
    if (branch.expanded && nameRef.current) {
      nameRef.current.focus();
    }
  }, [branch.expanded]);

  const toggleDuration = (durId) => {
    const current = branch.selectedDurations;
    const updated = current.includes(durId)
      ? current.length > 1 ? current.filter(d => d !== durId) : current
      : [...current, durId];
    onUpdate({ selectedDurations: updated });
  };

  const toggleMethod = (mId) => {
    const current = branch.selectedMethods;
    const updated = current.includes(mId)
      ? current.filter(id => id !== mId)
      : [...current, mId];
    onUpdate({ selectedMethods: updated });
  };

  const handlePriceChange = (durId, supplierId, val) => {
    onUpdate({
      prices: {
        ...branch.prices,
        [durId]: { ...(branch.prices[durId] || {}), [supplierId]: val },
      },
    });
  };

  const getDurationLabel = (id) => durations.find(d => d.id === id)?.label || id;

  return (
    <div className="cbpm-branch-card">
      <div className="cbpm-branch-header" onClick={() => onUpdate({ expanded: !branch.expanded })}>
        <div className="cbpm-branch-header-left">
          <GitBranchIcon className="icon-sm" style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
          <span className="cbpm-branch-index">فرع {index + 1}</span>
          {branch.name && <span className="cbpm-branch-name-preview">{branch.name}</span>}
          {!branch.name && <span className="cbpm-branch-name-placeholder">بدون اسم</span>}
        </div>
        <div className="cbpm-branch-header-right">
          {canRemove && (
            <button
              type="button"
              className="cbpm-remove-branch-btn"
              onClick={e => { e.stopPropagation(); onRemove(); }}
              title="حذف هذا الفرع"
            >
              <TrashIcon className="icon-sm" />
            </button>
          )}
          {branch.expanded ? <ChevronDownIcon className="icon-sm" /> : <ChevronLeftIcon className="icon-sm" />}
        </div>
      </div>

      {branch.expanded && (
        <div className="cbpm-branch-body">
          <div className="modal-field">
            <label className="modal-label">
              <span className="label-icon" style={{ display: 'flex' }}><TagIcon className="icon-xs" /></span>
              اسم الفرع
              <span className="label-required">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              className={`modal-input ${branch.nameError ? 'modal-input-error' : ''}`}
              placeholder="مثال: Plus — فردي، Premium — فريق..."
              value={branch.name}
              onChange={e => onUpdate({ name: e.target.value, nameError: '' })}
              dir="rtl"
              maxLength={100}
            />
            {branch.nameError && <span className="modal-error">{branch.nameError}</span>}
          </div>

          <div className="modal-field">
            <label className="modal-label">
              <span className="label-icon" style={{ display: 'flex' }}><UserIcon className="icon-xs" /></span>
              نوع الحساب
            </label>
            <div className="duration-chips">
              {[['none','غير محدد'],['individual','👤 فردي'],['team','👥 فريق']].map(([v,l]) => (
                <button
                  key={v}
                  type="button"
                  className={`duration-chip ${branch.accountType === v ? 'duration-chip-selected' : ''}`}
                  onClick={() => onUpdate({ accountType: v })}
                >
                  {branch.accountType === v && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">
              <span className="label-icon" style={{ display: 'flex' }}><CalendarIcon className="icon-xs" /></span>
              خطط الاشتراك
            </label>
            <div className="duration-chips">
              {durations.map(dur => (
                <button
                  key={dur.id}
                  type="button"
                  className={`duration-chip ${branch.selectedDurations.includes(dur.id) ? 'duration-chip-selected' : ''}`}
                  onClick={() => toggleDuration(dur.id)}
                >
                  {branch.selectedDurations.includes(dur.id) && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          {allMethods.length > 0 && (
            <div className="modal-field">
              <label className="modal-label">
                <span className="label-icon" style={{ display: 'flex' }}><ZapIcon className="icon-xs" /></span>
                طرق التفعيل
                <span className="modal-hint">اختياري</span>
              </label>
              <div className="duration-chips">
                {allMethods.map(m => {
                  const isSelected = branch.selectedMethods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`duration-chip ${isSelected ? 'duration-chip-selected' : ''}`}
                      onClick={() => toggleMethod(m.id)}
                      style={isSelected ? { border: `1px solid ${m.color}`, backgroundColor: `${m.color}15`, color: m.color } : {}}
                    >
                      {isSelected && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                      {m.icon} {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div className="modal-field">
              <label className="modal-label">
                <span className="label-icon" style={{ display: 'flex' }}><TagIcon className="icon-xs" /></span>
                الفئة
                <span className="modal-hint">اختياري</span>
              </label>
              <select
                className="modal-input"
                value={branch.categoryId || ''}
                onChange={e => onUpdate({ categoryId: e.target.value || null })}
                dir="rtl"
              >
                <option value="">بدون فئة</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="cbpm-prices-section">
            <div className="cbpm-prices-title">الأسعار (اختياري)</div>
            {branch.selectedDurations.map(durId => (
              <div key={durId} className="modal-plan-section" style={{ marginBottom: 8 }}>
                <div className="plan-section-header">
                  <span className="plan-duration-tag">{getDurationLabel(durId)}</span>
                </div>
                <div className="plan-prices-grid">
                  {suppliers.map(supplier => (
                    <div key={supplier.id} className="plan-price-row">
                      <div className="supplier-label">
                        <span className="supplier-dot" />
                        {supplier.name}
                      </div>
                      <div className="price-input-wrap">
                        <span className="price-prefix">$</span>
                        <input
                          type="number"
                          className="modal-price-input"
                          placeholder="0.00"
                          value={branch.prices[durId]?.[supplier.id] ?? ''}
                          onChange={e => handlePriceChange(durId, supplier.id, e.target.value)}
                          min="0"
                          step="0.01"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

let _branchCounter = 0;
function newBranchId() { return ++_branchCounter; }

export default function CreateBranchedProductModal({ isOpen, onClose, onConfirm, durations, suppliers, allMethods = [], categories = [] }) {
  const [parentName, setParentName] = useState('');
  const [parentNameError, setParentNameError] = useState('');
  const [branches, setBranches] = useState([]);
  const parentNameRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setParentName('');
      setParentNameError('');
      const defaultDurs = durations.length > 0 ? [durations[0].id] : [];
      setBranches([makeBranch(newBranchId(), defaultDurs), makeBranch(newBranchId(), defaultDurs)]);
      setTimeout(() => parentNameRef.current?.focus(), 80);
    }
  }, [isOpen, durations]);

  if (!isOpen) return null;

  const handleOverlayClick = e => { if (e.target === overlayRef.current) onClose(); };
  const handleKeyDown = e => { if (e.key === 'Escape') onClose(); };

  const addBranch = () => {
    const defaultDurs = durations.length > 0 ? [durations[0].id] : [];
    setBranches(prev => [...prev, makeBranch(newBranchId(), defaultDurs)]);
  };

  const removeBranch = (id) => {
    setBranches(prev => prev.filter(b => b._id !== id));
  };

  const updateBranch = (id, updates) => {
    setBranches(prev => prev.map(b => b._id === id ? { ...b, ...updates } : b));
  };

  const handleSubmit = () => {
    let valid = true;

    if (!parentName.trim()) {
      setParentNameError('الرجاء إدخال اسم المنتج المفرع');
      parentNameRef.current?.focus();
      valid = false;
    }

    const updatedBranches = branches.map(b => {
      if (!b.name.trim()) {
        valid = false;
        return { ...b, nameError: 'الرجاء إدخال اسم الفرع', expanded: true };
      }
      return b;
    });

    if (!valid) {
      setBranches(updatedBranches);
      return;
    }

    const branchData = branches.map(b => {
      const plans = b.selectedDurations.map((durId, idx) => {
        const planPrices = {};
        suppliers.forEach(s => {
          const val = parseFloat(b.prices[durId]?.[s.id]);
          planPrices[s.id] = isNaN(val) ? 0 : val;
        });
        return { id: idx + 1, durationId: durId, prices: planPrices, warrantyDays: 0 };
      });
      return {
        name: b.name.trim(),
        plans,
        activationMethods: b.selectedMethods,
        accountType: b.accountType,
        categoryId: b.categoryId,
      };
    });

    onConfirm({ parentName: parentName.trim(), branches: branchData });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="إنشاء منتج مفرع"
    >
      <div className="modal-box cbpm-modal-box" dir="rtl">
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #5E4FDE 0%, #7C6FEB 100%)', color: '#fff' }}>
          <div className="modal-header-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranchIcon />
          </div>
          <div className="modal-header-text">
            <h2>إنشاء منتج مفرع</h2>
            <p>حدد اسم المنتج الأساسي ثم أضف الفروع التابعة له</p>
          </div>
          <button className="modal-close-btn flex-row align-center justify-center" onClick={onClose} title="إغلاق">
            <XIcon className="icon-sm" />
          </button>
        </div>

        <div className="cbpm-body">
          <div className="cbpm-parent-section">
            <div className="cbpm-section-title">
              <PackageIcon className="icon-sm" style={{ color: 'var(--accent-blue)' }} />
              <span>اسم المنتج المفرع</span>
              <span className="cbpm-section-hint">يُخفى من الصفحات الأخرى — فروعه فقط تظهر كمنتجات</span>
            </div>
            <input
              ref={parentNameRef}
              type="text"
              className={`modal-input ${parentNameError ? 'modal-input-error' : ''}`}
              placeholder="مثال: ChatGPT Plus، Spotify، Microsoft 365..."
              value={parentName}
              onChange={e => { setParentName(e.target.value); setParentNameError(''); }}
              onKeyDown={e => e.key === 'Enter' && parentNameRef.current?.blur()}
              dir="rtl"
              maxLength={100}
            />
            {parentNameError && <span className="modal-error">{parentNameError}</span>}
          </div>

          <div className="cbpm-branches-section">
            <div className="cbpm-branches-header">
              <div className="cbpm-section-title">
                <GitBranchIcon className="icon-sm" style={{ color: 'var(--accent-green)' }} />
                <span>الفروع ({branches.length})</span>
              </div>
              <button
                type="button"
                className="cbpm-add-branch-btn"
                onClick={addBranch}
              >
                <PlusIcon className="icon-sm" />
                إضافة فرع
              </button>
            </div>

            {branches.length === 0 && (
              <div className="cbpm-no-branches">
                <GitBranchIcon className="icon-xl" />
                <p>لم تضف أي فروع بعد. انقر على "إضافة فرع" للبدء.</p>
              </div>
            )}

            <div className="cbpm-branches-list">
              {branches.map((branch, index) => (
                <BranchForm
                  key={branch._id}
                  branch={branch}
                  index={index}
                  durations={durations}
                  suppliers={suppliers}
                  allMethods={allMethods}
                  categories={categories}
                  onUpdate={updates => updateBranch(branch._id, updates)}
                  onRemove={() => removeBranch(branch._id)}
                  canRemove={branches.length > 1}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn modal-btn-ghost" onClick={onClose}>
            إلغاء
          </button>
          <button
            type="button"
            className="modal-btn modal-btn-primary"
            onClick={handleSubmit}
            disabled={branches.length === 0}
            style={{ background: '#5E4FDE', borderColor: '#5E4FDE' }}
          >
            <CheckCircleIcon className="icon-sm" style={{ display: 'flex' }} />
            إنشاء المنتج والفروع ({branches.length} {branches.length === 1 ? 'فرع' : 'فروع'})
          </button>
        </div>
      </div>
    </div>
  );
}
