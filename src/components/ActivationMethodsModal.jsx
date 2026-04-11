import React, { useState, useRef, useEffect } from 'react';
import { ZapIcon, XIcon, CheckCircleIcon, SettingsIcon, CheckIcon, TrashIcon, PlusIcon, EyeIcon, TagIcon, FileTextIcon, PaletteIcon, AlertTriangleIcon } from './Icons';
import ModalOverlay from './ModalOverlay';

/* ─────────────────────────────────────────────────────────────
   ActivationMethodsModal
   - Shows the global activation-method types
   - Lets the user toggle which ones apply to a specific product
   - Lets the user add brand-new method types
   ───────────────────────────────────────────────────────────── */
function ActivationMethodsModal({
  isOpen,
  onClose,
  product,
  allMethods,          // global list of method templates
  onToggleMethod,      // (productId, methodId) => void
  onAddMethodType,     // (newMethod) => void  — adds a global template
  onDeleteMethodType,  // (methodId) => void   — removes a global template
}) {
  const [tab, setTab] = useState('assign');   // 'assign' | 'manage'
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel]       = useState('');
  const [newIcon, setNewIcon]         = useState('🔑');
  const [newDesc, setNewDesc]         = useState('');
  const [newColor, setNewColor]       = useState('#5E4FDE');
  const [labelErr, setLabelErr]       = useState('');
  const labelRef = useRef(null);

  useEffect(() => {
    if (isOpen) { setTab('assign'); setShowAddForm(false); resetForm(); }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const assigned = product.activationMethods || [];

  const resetForm = () => {
    setNewLabel(''); setNewIcon('🔑'); setNewDesc(''); setNewColor('#5E4FDE'); setLabelErr('');
  };

  const handleAddType = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) { setLabelErr('الرجاء إدخال اسم الطريقة'); labelRef.current?.focus(); return; }
    const id = `custom_${Date.now()}`;
    onAddMethodType({ id, label: trimmed, icon: newIcon, description: newDesc.trim(), color: newColor });
    resetForm();
    setShowAddForm(false);
  };

  const ICON_PRESETS = ['🔑','📦','✉️','📱','💻','🌐','🔗','📧','👤','🎫','💳','🛡️','⚡','🎯'];
  const COLOR_PRESETS = ['#5E4FDE','#11BA65','#1A51F4','#F7784A','#F94B60','#FFC530','#0088cc','#25d366'];

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-box act-modal-box" dir="rtl">

        {/* ── Header ── */}
        <div className="modal-header act-modal-header">
          <div className="modal-header-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ZapIcon /></div>
          <div className="modal-header-text">
            <h2>طرق التفعيل</h2>
            <p>{product.name}</p>
          </div>
          <button className="modal-close-btn flex-row align-center justify-center" onClick={onClose}><XIcon className="icon-sm" /></button>
        </div>

        {/* ── Tabs ── */}
        <div className="act-tabs">
          <button className={`act-tab ${tab === 'assign' ? 'act-tab-active' : ''}`}
                  onClick={() => setTab('assign')}>
            <span className="flex-row align-center justify-center"><CheckCircleIcon className="icon-sm" /></span> تعيين للمنتج
          </button>
          <button className={`act-tab ${tab === 'manage' ? 'act-tab-active' : ''}`}
                  onClick={() => setTab('manage')}>
            <span className="flex-row align-center justify-center"><SettingsIcon className="icon-sm" /></span> إدارة الطرق
          </button>
        </div>

        {/* ── Body ── */}
        <div className="modal-body act-modal-body">

          {/* ─── TAB 1: Assign methods to this product ─── */}
          {tab === 'assign' && (
            <div className="act-assign-grid">
              {allMethods.length === 0 && (
                <div className="act-empty">
                  <span className="empty-icon"><SettingsIcon className="icon-xl" /></span>
                  <p>لا توجد طرق تفعيل بعد.<br/>اذهب لتبويب «إدارة الطرق» لإضافة طرق.</p>
                </div>
              )}
              {allMethods.map((m) => {
                const isOn = assigned.includes(m.id);
                return (
                  <button
                    key={m.id}
                    className={`act-method-card ${isOn ? 'act-method-card-on' : ''}`}
                    style={{ '--act-color': m.color }}
                    onClick={() => onToggleMethod(product.id, m.id)}
                  >
                    <div className="act-card-check">{isOn ? <span className="flex-row align-center justify-center"><CheckIcon className="icon-xs" /></span> : ''}</div>
                    <div className="act-card-icon">{m.icon}</div>
                    <div className="act-card-content">
                      <div className="act-card-label">{m.label}</div>
                      {m.description && <div className="act-card-desc">{m.description}</div>}
                    </div>
                    <div className={`act-card-toggle ${isOn ? 'toggle-on' : 'toggle-off'}`}>
                      <div className="toggle-thumb" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ─── TAB 2: Manage global method types ─── */}
          {tab === 'manage' && (
            <div className="act-manage-section">
              {/* Existing methods list */}
              <div className="act-manage-list">
                {allMethods.map((m) => (
                  <div key={m.id} className="act-manage-row" style={{ '--act-color': m.color }}>
                    <div className="act-manage-icon-wrap">
                      <span style={{ fontSize: 20 }}>{m.icon}</span>
                    </div>
                    <div className="act-manage-info">
                      <div className="act-manage-label">{m.label}</div>
                      {m.description && <div className="act-manage-desc">{m.description}</div>}
                    </div>
                    <button
                      className="act-manage-delete"
                      title="حذف الطريقة"
                      onClick={() => {
                        if (confirm(`حذف طريقة "${m.label}"؟ سيتم إزالتها من جميع المنتجات.`)) {
                          onDeleteMethodType(m.id);
                        }
                      }}
                    >
                      <TrashIcon className="icon-sm" />
                    </button>
                  </div>
                ))}
                {allMethods.length === 0 && (
                  <p className="act-manage-empty">لا توجد طرق مضافة بعد.</p>
                )}
              </div>

              {/* Add new method form toggle */}
              {!showAddForm ? (
                <button className="act-add-type-btn" onClick={() => { setShowAddForm(true); setTimeout(() => labelRef.current?.focus(), 80); }}>
                  <span className="flex-row align-center justify-center"><PlusIcon className="icon-sm" /></span> إضافة طريقة تفعيل جديدة
                </button>
              ) : (
                <div className="act-add-form">
                  <div className="act-form-title flex-row align-center gap-2"><PlusIcon className="icon-sm" /> طريقة تفعيل جديدة</div>

                  {/* Icon picker */}
                  <div className="modal-field">
                    <label className="modal-label"><span className="label-icon"><EyeIcon className="icon-xs" /></span> الأيقونة</label>
                    <div className="act-icon-picker">
                      {ICON_PRESETS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          className={`act-icon-btn ${newIcon === ic ? 'act-icon-btn-sel' : ''}`}
                          onClick={() => setNewIcon(ic)}
                        >{ic}</button>
                      ))}
                      <input
                        type="text"
                        className="act-icon-custom"
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        maxLength={4}
                        placeholder="أو اكتب"
                        title="أيقونة مخصصة"
                      />
                    </div>
                  </div>

                  {/* Label */}
                  <div className="modal-field">
                    <label className="modal-label">
                      <span className="label-icon"><TagIcon className="icon-xs" /></span> اسم الطريقة
                      <span className="label-required">*</span>
                    </label>
                    <input
                      ref={labelRef}
                      type="text"
                      className={`modal-input ${labelErr ? 'modal-input-error' : ''}`}
                      placeholder="مثال: حساب جاهز، رابط دعوة..."
                      value={newLabel}
                      onChange={(e) => { setNewLabel(e.target.value); setLabelErr(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                      dir="rtl"
                    />
                    {labelErr && <span className="modal-error">{labelErr}</span>}
                  </div>

                  {/* Description */}
                  <div className="modal-field">
                    <label className="modal-label"><span className="label-icon"><FileTextIcon className="icon-xs" /></span> وصف مختصر (اختياري)</label>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="مثال: يتطلب بريد إلكتروني وكلمة مرور"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      dir="rtl"
                    />
                  </div>

                  {/* Color */}
                  <div className="modal-field">
                    <label className="modal-label"><span className="label-icon"><PaletteIcon className="icon-xs" /></span> اللون</label>
                    <div className="act-color-picker">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`act-color-btn ${newColor === c ? 'act-color-btn-sel' : ''}`}
                          style={{ background: c }}
                          onClick={() => setNewColor(c)}
                          title={c}
                        />
                      ))}
                      <input
                        type="color"
                        className="act-color-custom"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        title="لون مخصص"
                      />
                    </div>
                    {/* Preview */}
                    <div className="act-preview-chip" style={{ background: `${newColor}18`, borderColor: `${newColor}44`, color: newColor }}>
                      <span>{newIcon}</span> {newLabel || 'معاينة الطريقة'}
                    </div>
                  </div>

                  <div className="act-form-actions">
                    <button className="modal-btn modal-btn-ghost" onClick={() => { setShowAddForm(false); resetForm(); }}>إلغاء</button>
                    <button className="modal-btn modal-btn-success" onClick={handleAddType}>
                      <span className="flex-row align-center justify-center"><CheckIcon className="icon-sm" /></span> إضافة
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          {tab === 'assign' && (
            <span className="act-footer-count">
              {assigned.length > 0
                ? <span className="flex-row align-center gap-1"><CheckCircleIcon className="icon-sm" style={{ color: 'var(--accent-green)' }} /> {assigned.length} {assigned.length === 1 ? 'طريقة مفعّلة' : 'طرق مفعّلة'}</span>
                : <span className="flex-row align-center gap-1"><AlertTriangleIcon className="icon-sm" style={{ color: 'var(--accent-orange)' }} /> لم تُحدَّد طرق بعد</span>}
            </span>
          )}
          <button className="modal-btn modal-btn-primary" onClick={onClose}>تم</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export default ActivationMethodsModal;
