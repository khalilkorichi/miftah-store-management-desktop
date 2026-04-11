import React, { useState, useEffect, useRef } from 'react';
import { PackageIcon, XIcon, CheckIcon, CheckCircleIcon, TagIcon, CalendarIcon, InfoIcon, ZapIcon, UserIcon, UsersIcon, ShieldCheckIcon, LinkIcon, PlusIcon } from './Icons';

const CATEGORY_ICONS = ['🤖','🎬','📚','💼','🔒','🎨','⚡','☁️','🎵','🖥️','📱','🌐','💡','🛡️','🎮'];
const CATEGORY_COLORS = ['#5E4FDE','#F7784A','#1A51F4','#11BA65','#F94B60','#EC4899','#FFC530','#0EA5E9','#8B5CF6','#10B981'];

function AddProductModal({ isOpen, onClose, onConfirm, durations, suppliers, allMethods = [], categories = [], onCreateCategory }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [selectedDurations, setSelectedDurations] = useState(['month_1', 'year_1']);
  const [selectedMethods, setSelectedMethods] = useState([]);
  const [accountType, setAccountType] = useState('none');
  const [storeUrl, setStoreUrl] = useState('');
  const [prices, setPrices] = useState({});
  const [warranties, setWarranties] = useState({});
  const [step, setStep] = useState(1);
  const [nameError, setNameError] = useState('');
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState(CATEGORY_ICONS[0]);
  const nameInputRef = useRef(null);
  const overlayRef = useRef(null);
  const newCatNameRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCategoryId(null);
      setSelectedDurations(['month_1', 'year_1']);
      setSelectedMethods([]);
      setAccountType('none');
      setStoreUrl('');
      setPrices({});
      setWarranties({});
      setStep(1);
      setNameError('');
      setShowNewCatForm(false);
      setNewCatName('');
      setNewCatColor(CATEGORY_COLORS[0]);
      setNewCatIcon(CATEGORY_ICONS[0]);
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    const newPrices = {};
    selectedDurations.forEach((durId) => {
      newPrices[durId] = newPrices[durId] || {};
      suppliers.forEach((s) => {
        newPrices[durId][s.id] = prices[durId]?.[s.id] ?? '';
      });
    });
    setPrices(newPrices);
  }, [selectedDurations, suppliers]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const toggleDuration = (durId) => {
    setSelectedDurations((prev) =>
      prev.includes(durId)
        ? prev.length > 1 ? prev.filter((d) => d !== durId) : prev
        : [...prev, durId]
    );
  };

  const toggleMethod = (methodId) => {
    setSelectedMethods((prev) =>
      prev.includes(methodId)
        ? prev.filter((id) => id !== methodId)
        : [...prev, methodId]
    );
  };

  const handlePriceChange = (durId, supplierId, val) => {
    setPrices((prev) => ({
      ...prev,
      [durId]: { ...prev[durId], [supplierId]: val },
    }));
  };

  const handleNextStep = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('الرجاء إدخال اسم المنتج');
      nameInputRef.current?.focus();
      return;
    }
    setNameError('');
    setStep(2);
  };

  const sanitizeUrl = (raw) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '';
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const plans = selectedDurations.map((durId, idx) => {
      const planPrices = {};
      suppliers.forEach((s) => {
        const val = parseFloat(prices[durId]?.[s.id]);
        planPrices[s.id] = isNaN(val) ? 0 : val;
      });
      const warrantyDays = Math.max(0, parseInt(warranties[durId]) || 0);
      return { id: idx + 1, durationId: durId, prices: planPrices, warrantyDays };
    });

    onConfirm({ name: trimmed, plans, activationMethods: selectedMethods, accountType, storeUrl: sanitizeUrl(storeUrl), categoryId });
    onClose();
  };

  const handleSaveNewCat = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const newId = `cat_custom_${Date.now()}`;
    const newCat = { id: newId, name: trimmed, color: newCatColor, icon: newCatIcon };
    if (onCreateCategory) {
      onCreateCategory(newCat);
      setCategoryId(newId);
    }
    setShowNewCatForm(false);
    setNewCatName('');
  };

  const getDurationLabel = (id) => durations.find((d) => d.id === id)?.label || id;

  const totalFilledPrices = selectedDurations.reduce((sum, durId) => {
    return sum + suppliers.filter((s) => parseFloat(prices[durId]?.[s.id]) > 0).length;
  }, 0);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="إضافة منتج جديد"
    >
      <div className="modal-box" dir="rtl">
        <div className="modal-header modal-header-blue">
          <div className="modal-header-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PackageIcon /></div>
          <div className="modal-header-text">
            <h2>إضافة منتج جديد</h2>
            <p>{step === 1 ? 'أدخل اسم المنتج واختر فئته والخطط' : 'أدخل أسعار كل مورد (اختياري)'}</p>
          </div>
          <button className="modal-close-btn flex-row align-center justify-center" onClick={onClose} title="إغلاق"><XIcon className="icon-sm" /></button>
        </div>

        <div className="modal-steps">
          <div className={`modal-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <div className="step-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{step > 1 ? <CheckIcon className="icon-xs" /> : '1'}</div>
            <span>اسم المنتج</span>
          </div>
          <div className="step-line" />
          <div className={`modal-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <span>الخطط والأسعار</span>
          </div>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="modal-step-content">
              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}><TagIcon className="icon-xs" /></span>
                  اسم المنتج
                  <span className="label-required">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  className={`modal-input ${nameError ? 'modal-input-error' : ''}`}
                  placeholder="مثال: ChatGPT Plus، Spotify Premium..."
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                  dir="rtl"
                  maxLength={100}
                />
                {nameError && <span className="modal-error">{nameError}</span>}
                <span className="modal-char-count">{name.length}/100</span>
              </div>

              {/* Category Selection */}
              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}>🏷️</span>
                  فئة المنتج
                  <span className="modal-hint">تساعد في تنظيم المنتجات والتقارير</span>
                </label>
                <div className="cat-chips-grid">
                  <button
                    type="button"
                    className={`cat-chip ${!categoryId ? 'cat-chip-selected' : ''}`}
                    onClick={() => { setCategoryId(null); setShowNewCatForm(false); }}
                    style={!categoryId ? {} : {}}
                  >
                    <span className="cat-chip-icon">📦</span>
                    <span className="cat-chip-name">بدون فئة</span>
                    {!categoryId && <span className="cat-chip-check"><CheckIcon className="icon-xs" /></span>}
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-chip ${categoryId === cat.id ? 'cat-chip-selected' : ''}`}
                      onClick={() => { setCategoryId(cat.id); setShowNewCatForm(false); }}
                      style={categoryId === cat.id ? {
                        borderColor: cat.color,
                        background: `${cat.color}18`,
                        color: cat.color,
                      } : {}}
                    >
                      <span className="cat-chip-icon">{cat.icon}</span>
                      <span className="cat-chip-name">{cat.name}</span>
                      {categoryId === cat.id && <span className="cat-chip-check" style={{ color: cat.color }}><CheckIcon className="icon-xs" /></span>}
                    </button>
                  ))}

                  <button
                    type="button"
                    className={`cat-chip cat-chip-add ${showNewCatForm ? 'cat-chip-add-active' : ''}`}
                    onClick={() => { setShowNewCatForm(true); setTimeout(() => newCatNameRef.current?.focus(), 60); }}
                  >
                    <span className="cat-chip-icon">➕</span>
                    <span className="cat-chip-name">فئة جديدة</span>
                  </button>
                </div>

                {showNewCatForm && (
                  <div className="new-cat-form">
                    <div className="new-cat-form-title">إنشاء فئة جديدة</div>
                    <input
                      ref={newCatNameRef}
                      type="text"
                      className="modal-input new-cat-name-input"
                      placeholder="اسم الفئة..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveNewCat()}
                      maxLength={40}
                      dir="rtl"
                    />
                    <div className="new-cat-row">
                      <div className="new-cat-section-label">اللون:</div>
                      <div className="new-cat-colors">
                        {CATEGORY_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`cat-color-swatch ${newCatColor === c ? 'cat-color-swatch-active' : ''}`}
                            style={{ background: c }}
                            onClick={() => setNewCatColor(c)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="new-cat-row">
                      <div className="new-cat-section-label">الأيقونة:</div>
                      <div className="new-cat-icons">
                        {CATEGORY_ICONS.map((ic) => (
                          <button
                            key={ic}
                            type="button"
                            className={`cat-icon-btn ${newCatIcon === ic ? 'cat-icon-btn-active' : ''}`}
                            onClick={() => setNewCatIcon(ic)}
                            style={newCatIcon === ic ? { borderColor: newCatColor, background: `${newCatColor}20` } : {}}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="new-cat-actions">
                      <button
                        type="button"
                        className="modal-btn modal-btn-ghost new-cat-cancel"
                        onClick={() => setShowNewCatForm(false)}
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        className="modal-btn modal-btn-primary new-cat-save"
                        onClick={handleSaveNewCat}
                        disabled={!newCatName.trim()}
                        style={{ background: newCatColor, borderColor: newCatColor }}
                      >
                        <span style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>
                        حفظ الفئة
                      </button>
                    </div>
                  </div>
                )}

                {selectedCategory && (
                  <div className="cat-selected-preview" style={{ borderColor: selectedCategory.color, background: `${selectedCategory.color}10` }}>
                    <span style={{ fontSize: 16 }}>{selectedCategory.icon}</span>
                    <span style={{ color: selectedCategory.color, fontWeight: 700, fontSize: 13 }}>تم اختيار: {selectedCategory.name}</span>
                  </div>
                )}
              </div>

              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}><LinkIcon className="icon-xs" /></span>
                  رابط المنتج في المتجر
                  <span className="modal-hint">اختياري — رابط صفحة المنتج</span>
                </label>
                <input
                  type="url"
                  className="modal-input"
                  placeholder="https://store.example.com/product/..."
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}><UserIcon className="icon-xs" /></span>
                  نوع الحساب
                  <span className="modal-hint">هل الحساب فردي أم يتبع لمجموعة (فريق)؟</span>
                </label>
                <div className="duration-chips">
                  <button
                    type="button"
                    className={`duration-chip ${accountType === 'none' ? 'duration-chip-selected' : ''}`}
                    onClick={() => setAccountType('none')}
                  >
                    {accountType === 'none' && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                    غير محدد
                  </button>
                  <button
                    type="button"
                    className={`duration-chip ${accountType === 'individual' ? 'duration-chip-selected' : ''}`}
                    onClick={() => setAccountType('individual')}
                  >
                    {accountType === 'individual' && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                    👤 فردي
                  </button>
                  <button
                    type="button"
                    className={`duration-chip ${accountType === 'team' ? 'duration-chip-selected' : ''}`}
                    onClick={() => setAccountType('team')}
                  >
                    {accountType === 'team' && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                    👥 فريق
                  </button>
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}><CalendarIcon className="icon-xs" /></span>
                  خطط الاشتراك
                  <span className="modal-hint">اختر الخطط المتاحة لهذا المنتج</span>
                </label>
                <div className="duration-chips">
                  {durations.map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      className={`duration-chip ${selectedDurations.includes(dur.id) ? 'duration-chip-selected' : ''}`}
                      onClick={() => toggleDuration(dur.id)}
                    >
                      {selectedDurations.includes(dur.id) && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                      {dur.label}
                    </button>
                  ))}
                </div>
                <p className="modal-notice">
                  <span className="flex-row align-center gap-1"><CheckCircleIcon className="icon-sm" style={{ color: 'var(--accent-green)' }} /> تم اختيار <strong>{selectedDurations.length}</strong> {selectedDurations.length === 1 ? 'خطة' : 'خطط'}</span>
                </p>
              </div>

              <div className="modal-field">
                <label className="modal-label">
                  <span className="label-icon" style={{ display: 'flex' }}><ZapIcon className="icon-xs" /></span>
                  طرق التفعيل للمنتج (اختياري)
                  <span className="modal-hint">اختر طرق التفعيل المتاحة لهذا المنتج</span>
                </label>
                <div className="duration-chips">
                  {allMethods.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>لا توجد طرق تفعيل مضافة في النظام.</span>
                  ) : (
                    allMethods.map((m) => {
                      const isSelected = selectedMethods.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`duration-chip ${isSelected ? 'duration-chip-selected' : ''}`}
                          onClick={() => toggleMethod(m.id)}
                          style={isSelected ? {
                            borderColor: m.color,
                            backgroundColor: m.color,
                            boxShadow: `0 2px 10px ${m.color}4d`
                          } : undefined}
                        >
                          {isSelected && <span className="chip-check" style={{ display: 'flex' }}><CheckIcon className="icon-xs" /></span>}
                          {m.icon} {m.label}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="modal-step-content">
              <div className="modal-product-preview">
                <span className="preview-icon" style={{ display: 'flex' }}>
                  {selectedCategory ? selectedCategory.icon : <PackageIcon />}
                </span>
                <span className="preview-name">{name}</span>
                {selectedCategory && (
                  <span className="preview-badge" style={{ background: `${selectedCategory.color}20`, color: selectedCategory.color, border: `1px solid ${selectedCategory.color}40` }}>
                    {selectedCategory.name}
                  </span>
                )}
                <span className="preview-badge">{selectedDurations.length} {selectedDurations.length === 1 ? 'خطة' : 'خطط'}</span>
              </div>

              <p className="modal-prices-hint">
                <InfoIcon className="icon-sm" style={{ color: 'var(--accent-blue)' }} /> الأسعار اختيارية — يمكنك إدخالها لاحقاً من الجدول
              </p>

              {selectedDurations.map((durId) => (
                <div key={durId} className="modal-plan-section">
                  <div className="plan-section-header">
                    <span className="plan-duration-tag">{getDurationLabel(durId)}</span>
                    <div className="plan-warranty-input-wrap">
                      <ShieldCheckIcon className="icon-xs" />
                      <input
                        type="number"
                        className="modal-warranty-input"
                        placeholder="0"
                        value={warranties[durId] ?? ''}
                        onChange={(e) => setWarranties((prev) => ({ ...prev, [durId]: e.target.value }))}
                        min="0"
                        max="365"
                        dir="ltr"
                      />
                      <span className="warranty-input-label">يوم ضمان</span>
                    </div>
                  </div>
                  <div className="plan-prices-grid">
                    {suppliers.map((supplier) => (
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
                            value={prices[durId]?.[supplier.id] ?? ''}
                            onChange={(e) => handlePriceChange(durId, supplier.id, e.target.value)}
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

              {totalFilledPrices > 0 && (
                <p className="modal-filled-count">
                  <span className="flex-row align-center gap-1"><CheckCircleIcon className="icon-sm" style={{ color: 'var(--accent-green)' }} /> تم إدخال <strong>{totalFilledPrices}</strong> سعر</span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 ? (
            <>
              <button className="modal-btn modal-btn-ghost" onClick={onClose}>إلغاء</button>
              <button className="modal-btn modal-btn-primary" onClick={handleNextStep}>
                التالي ←
              </button>
            </>
          ) : (
            <>
              <button className="modal-btn modal-btn-ghost" onClick={() => setStep(1)}>← رجوع</button>
              <button className="modal-btn modal-btn-success" onClick={handleSubmit}>
                <span style={{ display: 'flex' }}><CheckIcon className="icon-sm" /></span> إضافة المنتج
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddProductModal;
