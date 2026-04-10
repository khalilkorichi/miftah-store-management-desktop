import React, { useState } from 'react';
import { EyeIcon, XIcon, TagIcon, GlobeIcon, PlusIcon, TargetIcon, TrashIcon, DollarSignIcon, EditIcon, CheckCircleIcon } from './Icons';

function CompetitorsModal({
  isOpen,
  onClose,
  product,
  onAddCompetitor,
  onUpdateCompetitor,
  onDeleteCompetitor,
}) {
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  if (!isOpen || !product) return null;

  const competitors = product.competitors || [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;
    
    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const parsed = parseFloat(newPrice);
    const price = newPrice.trim() && isFinite(parsed) ? parsed : null;
    onAddCompetitor(product.id, newName.trim(), formattedUrl, price);
    setNewName('');
    setNewUrl('');
    setNewPrice('');
  };

  const handleStartEdit = (comp) => {
    setEditingId(comp.id);
    setEditPrice(comp.price != null ? String(comp.price) : '');
  };

  const handleSavePrice = (compId) => {
    const parsed = parseFloat(editPrice);
    const price = editPrice.trim() && isFinite(parsed) ? parsed : null;
    onUpdateCompetitor(product.id, compId, 'price', price);
    setEditingId(null);
    setEditPrice('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box competitors-modal" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="modal-header">
          <div className="modal-header-text">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)', fontSize: '18px' }}>
              <EyeIcon className="icon-md" style={{ color: 'var(--accent-blue)' }} />
              مراقبة المنافسين
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400' }}>
              {product.name}
            </p>
          </div>
          <button className="modal-close-btn flex-row align-center justify-center" onClick={onClose} title="إغلاق" aria-label="إغلاق" style={{ padding: 0 }}>
            <XIcon className="icon-sm" />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p className="modal-subtitle" style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.6' }}>
            أضف بيانات المنافسين (اسم المتجر، السعر، رابط المنتج) لتتبع الأسعار والحصول على توصيات تسعيرية من المساعد الذكي.
          </p>
          
          <form className="competitor-add-form" onSubmit={handleAdd}>
            <div className="competitor-form-row">
              <div className="competitor-form-field" style={{ flex: '1', minWidth: '140px' }}>
                <label className="competitor-field-label">اسم المتجر</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none', display: 'flex' }}><TagIcon className="icon-xs" /></div>
                  <input
                    type="text"
                    placeholder="مثال: أمازون"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="competitor-input focus-ring"
                    style={{ paddingRight: '32px' }}
                  />
                </div>
              </div>
              
              <div className="competitor-form-field" style={{ flex: '0.8', minWidth: '120px' }}>
                <label className="competitor-field-label">السعر (ر.س)</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none', display: 'flex' }}><DollarSignIcon className="icon-xs" /></div>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="competitor-input focus-ring"
                    style={{ paddingRight: '32px' }}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="competitor-form-row">
              <div className="competitor-form-field" style={{ flex: '1', minWidth: '200px' }}>
                <label className="competitor-field-label">رابط صفحة المنتج</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none', display: 'flex' }}><GlobeIcon className="icon-xs" /></div>
                  <input
                    type="url"
                    placeholder="https://example.com/product"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    required
                    className="competitor-input focus-ring"
                    style={{ paddingLeft: '32px' }}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="competitor-add-btn hover-lift"
            >
              <PlusIcon className="icon-sm" /> إضافة منافس
            </button>
          </form>

          {competitors.length > 0 && (
            <div className="competitors-summary">
              <span>{competitors.length} منافس مُضاف</span>
            </div>
          )}

          <div className="competitors-list" style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
            {competitors.length === 0 ? (
              <div className="empty-competitors">
                <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: 'var(--text-muted)', opacity: 0.5 }}><TargetIcon style={{ width: '32px', height: '32px' }} /></div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>لا يوجد منافسين مضافين لهذا المنتج بعد.</p>
                <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '12px', opacity: 0.7 }}>أضف منافسين ليتمكن المساعد الذكي من مقارنة الأسعار</p>
              </div>
            ) : (
              competitors.map((comp) => (
                <div key={comp.id} className="competitor-card">
                  <div className="competitor-card-header">
                    <div className="comp-info" style={{ flex: 1 }}>
                      <span className="comp-name">{comp.name}</span>
                      <a href={comp.url} target="_blank" rel="noopener noreferrer" className="comp-link flex-row align-center gap-1" title="تصفح صفحة المنافس">
                        <GlobeIcon className="icon-xs" /> عرض الصفحة
                      </a>
                    </div>
                    <div className="competitor-card-actions">
                      <button
                        className="btn-edit-comp"
                        onClick={() => handleStartEdit(comp)}
                        title="تعديل السعر"
                      >
                        <EditIcon className="icon-xs" />
                      </button>
                      <button
                        className="btn-delete-comp"
                        onClick={() => onDeleteCompetitor(product.id, comp.id)}
                        title="حذف المنافس"
                      >
                        <TrashIcon className="icon-xs" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="competitor-card-price">
                    {editingId === comp.id ? (
                      <div className="price-edit-row">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          min="0"
                          step="0.01"
                          className="competitor-input price-edit-input focus-ring"
                          placeholder="أدخل السعر"
                          dir="ltr"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePrice(comp.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <span className="price-currency-label">ر.س</span>
                        <button className="btn-save-price" onClick={() => handleSavePrice(comp.id)} title="حفظ">
                          <CheckCircleIcon className="icon-xs" />
                        </button>
                        <button className="btn-cancel-price" onClick={handleCancelEdit} title="إلغاء">
                          <XIcon className="icon-xs" />
                        </button>
                      </div>
                    ) : (
                      <div className="price-display" onClick={() => handleStartEdit(comp)} title="انقر لتعديل السعر">
                        <DollarSignIcon className="icon-xs" style={{ opacity: 0.5 }} />
                        {comp.price != null && isFinite(Number(comp.price)) ? (
                          <span className="price-value">{Number(comp.price).toFixed(2)} <span className="price-currency">ر.س</span></span>
                        ) : (
                          <span className="price-not-set">لم يُحدد السعر</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompetitorsModal;
