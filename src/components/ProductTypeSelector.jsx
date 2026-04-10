import React from 'react';
import { createPortal } from 'react-dom';
import { PlusIcon, XIcon } from './Icons';

export default function ProductTypeSelector({ isOpen, onClose, onSelectNormal, onSelectBranched }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) onClose();
  };

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="اختر نوع المنتج"
      onClick={handleOverlayClick}
      onKeyDown={e => e.key === 'Escape' && onClose()}
      style={{ zIndex: 3000 }}
    >
      <div className="modal-box pts-modal" dir="rtl" style={{ maxWidth: 460, padding: 0, overflow: 'hidden' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1A51F4 0%, #5E4FDE 100%)' }}>
          <div className="modal-header-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlusIcon />
          </div>
          <div className="modal-header-text">
            <h2>إضافة منتج جديد</h2>
            <p>اختر نوع المنتج الذي تريد إضافته</p>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            title="إغلاق"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <XIcon className="icon-sm" />
          </button>
        </div>
        <div className="pts-options">
          <button className="pts-option-card" onClick={onSelectNormal}>
            <span className="pts-option-emoji">📦</span>
            <span className="pts-option-title">منتج عادي</span>
            <span className="pts-option-desc">منتج مستقل يظهر في جميع الصفحات كما هو</span>
          </button>
          <button className="pts-option-card pts-option-card--branched" onClick={onSelectBranched}>
            <span className="pts-option-emoji">🌿</span>
            <span className="pts-option-title">منتج مفرع</span>
            <span className="pts-option-desc">وعاء يحتوي على عدة فروع — فروعه تظهر كمنتجات مستقلة</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
