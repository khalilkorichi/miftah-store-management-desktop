import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  XIcon, TagIcon, StarIcon, ShieldCheckIcon, UserIcon, UsersIcon,
  EditIcon, PlusIcon, TrashIcon, ChevronDownIcon, LinkIcon, ExternalLinkIcon, ClipboardIcon
} from './Icons';

function PasteBtn({ onPaste }) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onPaste(text.trim());
    } catch { /* denied */ }
  };
  return (
    <button type="button" className="paste-btn" onClick={handlePaste} title="لصق من الحافظة">
      <ClipboardIcon className="icon-xs" />
    </button>
  );
}

const fmtNum = (val) => {
  if (val === null || val === undefined) return '0';
  return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function ProductDetailModal({
  isOpen, product, suppliers, durations, exchangeRate, activationMethods = [],
  categories = [], onAddCategory, onUpdateCategory,
  onClose, onUpdatePrice, onUpdateOfficialPrice, onUpdateWarranty, onUpdateSupplierWarranty, onUpdateProductUrl,
  onAddPlan, onDeletePlan, getDurationLabel, getAvailableDurations,
  onUpdateSupplierActivationMethod, onUpdateSupplierPlanLink,
  requestConfirm
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [addingPlan, setAddingPlan] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [warrantyDaysInput, setWarrantyDaysInput] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [editingSupplierLink, setEditingSupplierLink] = useState(null); // supplierId
  const [supplierLinkInput, setSupplierLinkInput] = useState('');
  const [openMethodPicker, setOpenMethodPicker] = useState(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

  const sanitizeUrl = (raw) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '';
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return '';
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  };
  const [closing, setClosing] = useState(false);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setEditingUrl(false);
      setUrlValue('');
      setEditingSupplierLink(null);
      setSupplierLinkInput('');
      setOpenMethodPicker(null);
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && isOpen) handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  if (!isOpen || !product) return null;

  const assignedMethods = (product.activationMethods || [])
    .map((mId) => activationMethods.find((x) => x.id === mId))
    .filter(Boolean);

  const findBestPriceForPlan = (plan) => {
    let min = Infinity;
    let bestSupplierId = null;
    for (const [sid, price] of Object.entries(plan.prices)) {
      if (price > 0 && price < min) {
        min = price;
        bestSupplierId = parseInt(sid);
      }
    }
    return bestSupplierId;
  };

  const availableDurations = getAvailableDurations(product);
  const plans = product.plans || [];
  const accountTypeLabel = product.accountType === 'individual' ? 'فردي' : product.accountType === 'team' ? 'فريق' : null;

  const findBestSupplierForPlan = (plan) => {
    const bestId = findBestPriceForPlan(plan);
    return bestId;
  };

  const getLowestPrice = () => {
    let min = Infinity;
    for (const plan of plans) {
      for (const price of Object.values(plan.prices)) {
        if (price > 0 && price < min) min = price;
      }
    }
    return min === Infinity ? null : min;
  };

  const getHighestPrice = () => {
    let max = 0;
    for (const plan of plans) {
      for (const price of Object.values(plan.prices)) {
        if (price > max) max = price;
      }
    }
    return max === 0 ? null : max;
  };

  const getTotalSupplierPrices = (supplierId) => {
    let total = 0;
    let count = 0;
    for (const plan of plans) {
      const p = plan.prices[supplierId];
      if (p > 0) { total += p; count++; }
    }
    return { total, count };
  };

  const lowestPrice = getLowestPrice();
  const highestPrice = getHighestPrice();

  return (
    <div className={`pdm-overlay ${closing ? 'pdm-closing' : ''}`} ref={overlayRef} onClick={handleOverlayClick}>
      <div ref={containerRef} className={`pdm-container ${closing ? 'pdm-slide-out' : 'pdm-slide-in'}`}>
        <div className="pdm-header">
          <div className="pdm-header-content">
            <div className="pdm-title-area">
              <h2 className="pdm-product-name">{product.name}</h2>
              <div className="pdm-badges">
                {accountTypeLabel && (
                  <span className={`pdm-badge type-${product.accountType}`}>
                    {product.accountType === 'individual' ? <UserIcon className="icon-xs" /> : <UsersIcon className="icon-xs" />}
                    {accountTypeLabel}
                  </span>
                )}
                <span className="pdm-badge plans-count">
                  <TagIcon className="icon-xs" />
                  {plans.length} {plans.length === 1 ? 'خطة' : 'خطط'}
                </span>
              </div>
            </div>
            <button className="pdm-close-btn" onClick={handleClose} title="إغلاق">
              <XIcon className="icon-md" />
            </button>
          </div>

          {assignedMethods.length > 0 && (
            <div className="pdm-methods-row">
              {assignedMethods.map((m) => (
                <span key={m.id} className="pdm-method-chip" style={{ '--act-color': m.color }}>
                  {m.icon} {m.label}
                </span>
              ))}
            </div>
          )}

          <div className="pdm-url-row">
            <LinkIcon className="icon-sm" />
            {editingUrl ? (
              <input
                type="url"
                className="pdm-url-input"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onBlur={() => { onUpdateProductUrl(product.id, sanitizeUrl(urlValue)); setEditingUrl(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateProductUrl(product.id, sanitizeUrl(urlValue)); setEditingUrl(false); } if (e.key === 'Escape') setEditingUrl(false); }}
                placeholder="https://store.example.com/product/..."
                autoFocus
                dir="ltr"
              />
            ) : product.storeUrl ? (
              <div className="pdm-url-display">
                <a href={product.storeUrl} target="_blank" rel="noopener noreferrer" className="pdm-url-link" dir="ltr" title={product.storeUrl}>
                  {product.storeUrl}
                  <ExternalLinkIcon className="icon-xs" />
                </a>
                <button className="pdm-url-edit-btn" onClick={() => { setEditingUrl(true); setUrlValue(product.storeUrl || ''); }} title="تعديل الرابط">
                  <EditIcon className="icon-xs" />
                </button>
              </div>
            ) : (
              <button className="pdm-url-add-btn" onClick={() => { setEditingUrl(true); setUrlValue(''); }}>
                إضافة رابط المتجر
              </button>
            )}
          </div>

          <div className="pdm-category-row">
            <span className="pdm-category-label">الفئة:</span>
            {addingCategory ? (
              <div className="pdm-category-new-input-wrap">
                <input
                  className="pdm-category-new-input"
                  type="text"
                  placeholder="اسم الفئة الجديدة..."
                  autoFocus
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newCategoryName.trim()) {
                      const newCat = { id: `cat_${Date.now()}`, name: newCategoryName.trim(), color: '#6366f1' };
                      onAddCategory && onAddCategory(newCat);
                      onUpdateCategory && onUpdateCategory(product.id, newCat.id);
                      setAddingCategory(false);
                      setNewCategoryName('');
                    } else if (e.key === 'Escape') {
                      setAddingCategory(false);
                      setNewCategoryName('');
                    }
                  }}
                />
                <button className="pdm-category-confirm-btn" onClick={() => {
                  if (newCategoryName.trim()) {
                    const newCat = { id: `cat_${Date.now()}`, name: newCategoryName.trim(), color: '#6366f1' };
                    onAddCategory && onAddCategory(newCat);
                    onUpdateCategory && onUpdateCategory(product.id, newCat.id);
                    setAddingCategory(false);
                    setNewCategoryName('');
                  }
                }}>✓</button>
                <button className="pdm-category-cancel-btn" onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}>✕</button>
              </div>
            ) : (
              <>
                <select
                  className="pdm-category-select"
                  value={product.categoryId || ''}
                  onChange={e => onUpdateCategory && onUpdateCategory(product.id, e.target.value)}
                >
                  <option value="">— بدون فئة —</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button className="pdm-category-add-btn" title="إضافة فئة جديدة" onClick={() => setAddingCategory(true)}>+</button>
              </>
            )}
          </div>

          <div className="pdm-stats-bar">
            {lowestPrice && (
              <div className="pdm-stat">
                <span className="pdm-stat-label">أقل سعر</span>
                <span className="pdm-stat-value best" dir="ltr">{fmtNum(lowestPrice * exchangeRate)} ر.س</span>
              </div>
            )}
            {highestPrice && (
              <div className="pdm-stat">
                <span className="pdm-stat-label">أعلى سعر</span>
                <span className="pdm-stat-value" dir="ltr">{fmtNum(highestPrice * exchangeRate)} ر.س</span>
              </div>
            )}
            <div className="pdm-stat">
              <span className="pdm-stat-label">الموردين</span>
              <span className="pdm-stat-value">{suppliers.length}</span>
            </div>
          </div>
        </div>

        <div className="pdm-body">
          <div className="pdm-comparison-wrapper">
            <table className="pdm-comparison-table">
              <thead>
                <tr>
                  <th className="pdm-th-supplier">المورد</th>
                  {plans.map((plan) => {
                    const bestId = findBestSupplierForPlan(plan);
                    return (
                      <th key={plan.id} className="pdm-th-plan">
                        <div className="pdm-plan-header-cell">
                          <span className="pdm-plan-duration">{getDurationLabel(plan.durationId)}</span>
                          {(() => {
                            const vals = Object.values(plan.supplierWarranty || {}).filter(v => v > 0);
                            if (vals.length === 0) return null;
                            const minW = Math.min(...vals), maxW = Math.max(...vals);
                            return (
                              <span className="pdm-plan-warranty">
                                <ShieldCheckIcon className="icon-xs" />
                                {minW === maxW ? `${minW} يوم` : `${minW}–${maxW} يوم`}
                              </span>
                            );
                          })()}
                          {plan.officialPriceUsd > 0 && (
                            <span className="pdm-plan-official" dir="rtl">
                              الرسمي: {fmtNum(plan.officialPriceUsd * (exchangeRate || 1))} ر.س
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => {
                  const { total, count } = getTotalSupplierPrices(supplier.id);
                  const supplierLink = (product.supplierLinks || {})[supplier.id] || '';
                  const supplierMethods = (product.supplierActivationMethods || {})[supplier.id] || [];
                  const effectiveMethods = supplierMethods;
                  const isEditingLink = editingSupplierLink === supplier.id;
                  const isPickerOpen = openMethodPicker === supplier.id;
                  return (
                    <tr key={supplier.id} className="pdm-supplier-row">
                      <td className="pdm-td-supplier">
                        <div className="pdm-supplier-info">
                          {/* Row 1: name + link button */}
                          <div className="pdm-supplier-name-row">
                            <span className="pdm-supplier-name">{supplier.name}</span>
                            <button
                              className={`pdm-sup-icon-btn ${supplierLink ? 'has-link' : ''}`}
                              title={supplierLink ? 'تعديل رابط المنتج' : 'إضافة رابط المنتج'}
                              onClick={() => { setSupplierLinkInput(supplierLink); setEditingSupplierLink(supplier.id); }}
                            >🔗</button>
                          </div>
                          {/* Row 2: avg + method button */}
                          <div className="pdm-supplier-avg-row">
                            {count > 0 ? (
                              <span className="pdm-supplier-avg" dir="ltr">متوسط: {fmtNum((total / count) * (exchangeRate || 1))} ر.س</span>
                            ) : <span className="pdm-supplier-avg">—</span>}
                            <div style={{ position: 'relative' }}>
                              <button
                                className={`pdm-sup-icon-btn ${effectiveMethods.length > 0 ? 'has-methods' : ''}`}
                                title="طرق التفعيل"
                                onClick={(e) => {
                                  if (isPickerOpen) { setOpenMethodPicker(null); return; }
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setPickerPos({ top: rect.bottom + 4, left: rect.left });
                                  setOpenMethodPicker(supplier.id);
                                }}
                              >⚙</button>
                            </div>
                          </div>
                          {/* Link edit / display */}
                          {isEditingLink && (
                            <div className="pdm-sup-link-edit">
                              <input
                                className="pdm-sup-link-input"
                                value={supplierLinkInput}
                                onChange={e => setSupplierLinkInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') { onUpdateSupplierPlanLink?.(product.id, supplier.id, supplierLinkInput.trim()); setEditingSupplierLink(null); }
                                  if (e.key === 'Escape') setEditingSupplierLink(null);
                                }}
                                placeholder="https://..."
                                dir="ltr"
                                autoFocus
                              />
                              <PasteBtn onPaste={(t) => setSupplierLinkInput(t)} />
                              <button className="pdm-sup-link-save" onClick={() => { onUpdateSupplierPlanLink?.(product.id, supplier.id, supplierLinkInput.trim()); setEditingSupplierLink(null); }}>✓</button>
                              <button className="pdm-sup-link-cancel" onClick={() => setEditingSupplierLink(null)}>✕</button>
                            </div>
                          )}
                          {!isEditingLink && supplierLink && (
                            <a href={supplierLink} target="_blank" rel="noopener noreferrer" className="pdm-sup-link-chip" dir="ltr" title={supplierLink}>
                              🔗 {supplierLink.replace(/^https?:\/\//, '').substring(0, 26)}{supplierLink.length > 33 ? '…' : ''}
                            </a>
                          )}
                          {/* Method chips */}
                          {effectiveMethods.length > 0 && (
                            <div className="pdm-sup-methods-row">
                              {effectiveMethods.map(mId => {
                                const m = activationMethods.find(x => x.id === mId);
                                return m ? (
                                  <span key={mId} className="pdm-sup-method-chip" style={{ '--act-color': m.color }}>
                                    {m.icon} {m.label}
                                    <button className="pdm-sup-method-remove" onClick={() => onUpdateSupplierActivationMethod?.(product.id, supplier.id, mId, false)}>✕</button>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      {plans.map((plan) => {
                        const priceUsd = plan.prices[supplier.id] || 0;
                        const bestId = findBestPriceForPlan(plan);
                        const isBest = supplier.id === bestId;
                        const cellKey = `${plan.id}-${supplier.id}`;
                        const officialPrice = plan.officialPriceUsd || 0;
                        const savings = officialPrice > 0 && priceUsd > 0 ? officialPrice - priceUsd : 0;
                        const savingsPct = officialPrice > 0 && priceUsd > 0 ? ((savings / officialPrice) * 100) : 0;

                        return (
                          <td key={plan.id} className={`pdm-td-price ${isBest ? 'pdm-best' : ''} ${priceUsd === 0 ? 'pdm-empty' : ''}`}>
                            {editingCell === cellKey ? (
                              <div className="pdm-price-edit-wrap">
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => { onUpdatePrice(product.id, plan.id, supplier.id, editValue); setEditingCell(null); }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { onUpdatePrice(product.id, plan.id, supplier.id, editValue); setEditingCell(null); } }}
                                  step="0.01" min="0" autoFocus
                                  className="pdm-price-input"
                                  dir="ltr"
                                />
                                <PasteBtn onPaste={(t) => setEditValue(t)} />
                              </div>
                            ) : (
                              <button className="pdm-price-btn" onClick={() => { setEditingCell(cellKey); setEditValue((priceUsd || 0).toString()); }}>
                                {priceUsd > 0 ? (
                                  <div className="pdm-price-content">
                                    <span className="pdm-price-usd" dir="ltr">${fmtNum(priceUsd)}</span>
                                    <span className="pdm-price-sar" dir="ltr">{fmtNum(priceUsd * exchangeRate)} ﷼</span>
                                    {isBest && <span className="pdm-best-badge"><StarIcon className="icon-xs" /> الأفضل</span>}
                                    {savingsPct > 0 && (
                                      <span className="pdm-savings" dir="ltr">وفّر {savingsPct.toLocaleString('en-US', { maximumFractionDigits: 0 })}%</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="pdm-no-price">—</span>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pdm-plans-details">
            <h3 className="pdm-section-title">
              <TagIcon className="icon-sm" /> تفاصيل الخطط
            </h3>
            <div className="pdm-plans-grid">
              {plans.map((plan) => {
                const bestId = findBestPriceForPlan(plan);
                const bestSupplier = bestId ? suppliers.find(s => s.id === bestId) : null;
                const bestPrice = bestId ? plan.prices[bestId] : null;
                return (
                  <div key={plan.id} className="pdm-plan-card">
                    <div className="pdm-plan-card-header">
                      <span className="pdm-plan-card-duration">{getDurationLabel(plan.durationId)}</span>
                      {plans.length > 1 && (
                        <button className="pdm-plan-delete" onClick={() => requestConfirm('حذف الخطة', `هل أنت متأكد من رغبتك في حذف خطة "${getDurationLabel(plan.durationId)}"؟`, () => onDeletePlan(product.id, plan.id))}>
                          <TrashIcon className="icon-xs" />
                        </button>
                      )}
                    </div>
                    <div className="pdm-plan-card-body">
                      <div className="pdm-warranty-section">
                        <div className="pdm-warranty-section-title"><ShieldCheckIcon className="icon-xs" /> الضمان لكل مورد</div>
                        {suppliers.map((supplier) => {
                          const supWarranty = (plan.supplierWarranty || {})[supplier.id] || 0;
                          const cellKey = `warranty-${plan.id}-${supplier.id}`;
                          const isEditing = editingCell === cellKey;
                          const saveWarranty = () => {
                            if (onUpdateSupplierWarranty) onUpdateSupplierWarranty(product.id, plan.id, supplier.id, warrantyDaysInput);
                            setEditingCell(null);
                          };
                          return (
                            <div key={supplier.id} className="pdm-warranty-supplier-row">
                              <span className="pdm-warranty-supplier-name">{supplier.name}</span>
                              {isEditing ? (
                                <div className="pdm-warranty-edit-wrap">
                                  <input
                                    type="number"
                                    value={warrantyDaysInput}
                                    onChange={(e) => setWarrantyDaysInput(e.target.value)}
                                    onBlur={saveWarranty}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveWarranty(); if (e.key === 'Escape') setEditingCell(null); }}
                                    min="0" max="3650" autoFocus
                                    className="pdm-warranty-input"
                                    dir="ltr"
                                    placeholder="0"
                                  />
                                  <span className="pdm-warranty-days-label">يوم</span>
                                  <div className="pdm-warranty-presets">
                                    <button className="pdm-warranty-preset" onMouseDown={(e) => { e.preventDefault(); setWarrantyDaysInput('30'); }} title="شهر">شهر</button>
                                    <button className="pdm-warranty-preset" onMouseDown={(e) => { e.preventDefault(); setWarrantyDaysInput('180'); }} title="6 أشهر">6 أشهر</button>
                                    <button className="pdm-warranty-preset" onMouseDown={(e) => { e.preventDefault(); setWarrantyDaysInput('365'); }} title="سنة">سنة</button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className={`pdm-warranty-value-btn ${supWarranty > 0 ? 'has-warranty' : ''}`}
                                  onClick={() => { setEditingCell(cellKey); setWarrantyDaysInput(supWarranty.toString()); }}
                                >
                                  {supWarranty > 0 ? `${supWarranty} يوم` : 'تحديد'}
                                  <EditIcon className="icon-xs" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="pdm-plan-card-row">
                        <span className="pdm-plan-card-label">السعر الرسمي</span>
                        {editingCell === `official-${plan.id}` ? (
                          <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => { onUpdateOfficialPrice(product.id, plan.id, editValue); setEditingCell(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdateOfficialPrice(product.id, plan.id, editValue); setEditingCell(null); } }}
                            step="0.01" min="0" autoFocus className="pdm-price-input small" dir="ltr" />
                        ) : (
                          <button className="pdm-plan-card-value clickable" onClick={() => { setEditingCell(`official-${plan.id}`); setEditValue((plan.officialPriceUsd || 0).toString()); }} dir="ltr">
                            {plan.officialPriceUsd > 0 ? `$${fmtNum(plan.officialPriceUsd)}` : 'تحديد'}
                            <EditIcon className="icon-xs" />
                          </button>
                        )}
                      </div>
                      {bestSupplier && bestPrice && (
                        <div className="pdm-plan-card-row best-row">
                          <span className="pdm-plan-card-label"><StarIcon className="icon-xs" /> أفضل سعر</span>
                          <span className="pdm-plan-card-value best-value" dir="ltr">
                            ${fmtNum(bestPrice)} — {bestSupplier.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {availableDurations.length > 0 && (
                <div className="pdm-add-plan-card">
                  {addingPlan ? (
                    <select className="pdm-plan-select" onChange={(e) => { if (e.target.value) { onAddPlan(product.id, e.target.value); setAddingPlan(false); } }} autoFocus onBlur={() => setAddingPlan(false)} dir="rtl">
                      <option value="">اختر المدة...</option>
                      {availableDurations.map((d) => (<option key={d.id} value={d.id}>{d.label}</option>))}
                    </select>
                  ) : (
                    <button className="pdm-add-plan-btn" onClick={() => setAddingPlan(true)}>
                      <PlusIcon className="icon-md" />
                      <span>إضافة خطة</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {openMethodPicker && (() => {
        const supplierId = openMethodPicker;
        const supplierMethods = (product.supplierActivationMethods || {})[supplierId] || [];
        return (
          <>
            <div className="pdm-method-picker-backdrop" onClick={() => setOpenMethodPicker(null)} />
            <div className="pdm-method-picker" style={{ top: pickerPos.top, left: pickerPos.left }}>
              {activationMethods.map(m => {
                const active = supplierMethods.includes(m.id);
                return (
                  <button key={m.id} className={`pdm-method-picker-item ${active ? 'active' : ''}`}
                    onClick={() => onUpdateSupplierActivationMethod?.(product.id, supplierId, m.id, !active)}>
                    {m.icon} {m.label}
                    {active && <span className="pdm-method-check">✓</span>}
                  </button>
                );
              })}
              <button className="pdm-method-picker-close" onClick={() => setOpenMethodPicker(null)}>إغلاق</button>
            </div>
          </>
        );
      })()}
    </div>
  );
}

export default ProductDetailModal;
