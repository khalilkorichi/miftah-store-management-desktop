import React, { useState, useEffect, useRef } from 'react';
import { BuildingIcon, XIcon, TagIcon, MessageCircleIcon, SendIcon, ShoppingCartIcon, CheckIcon } from './Icons';
import ModalOverlay from './ModalOverlay';

function AddSupplierModal({ isOpen, onClose, onConfirm }) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [g2g, setG2g] = useState('');
  const [nameError, setNameError] = useState('');
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setWhatsapp('');
      setTelegram('');
      setG2g('');
      setNameError('');
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('الرجاء إدخال اسم المورد');
      nameInputRef.current?.focus();
      return;
    }
    onConfirm({
      name: trimmedName,
      whatsapp: whatsapp.trim(),
      telegram: telegram.trim(),
      g2g: g2g.trim(),
    });
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit();
  };

  const filledCount = [name, whatsapp, telegram, g2g].filter((v) => v.trim()).length;
  const completionPct = Math.round((filledCount / 4) * 100);

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-box" dir="rtl">
        {/* Header */}
        <div className="modal-header modal-header-green">
          <div className="modal-header-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BuildingIcon /></div>
          <div className="modal-header-text">
            <h2>إضافة مورد جديد</h2>
            <p>أدخل بيانات المورد ومعلومات التواصل</p>
          </div>
          <button className="modal-close-btn flex-row align-center justify-center" onClick={onClose} title="إغلاق"><XIcon className="icon-sm" /></button>
        </div>

        {/* Completion bar */}
        <div className="modal-progress-bar">
          <div className="modal-progress-track">
            <div
              className="modal-progress-fill"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="modal-progress-label">اكتمال البيانات: {completionPct}%</span>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Supplier Name */}
          <div className="modal-field">
            <label className="modal-label">
              <span className="label-icon" style={{ display: 'flex' }}><TagIcon className="icon-xs" /></span>
              اسم المورد
              <span className="label-required">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              className={`modal-input ${nameError ? 'modal-input-error' : ''}`}
              placeholder="مثال: متجر الديجيتال، سوق السيرفرات..."
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              dir="rtl"
              maxLength={60}
            />
            {nameError && <span className="modal-error">{nameError}</span>}
          </div>

          {/* Divider */}
          <div className="modal-section-divider">
            <span>معلومات التواصل (اختيارية)</span>
          </div>

          {/* Contact fields */}
          <div className="contact-fields-grid">
            {/* WhatsApp */}
            <div className="modal-field contact-field">
              <label className="modal-label">
                <span className="contact-platform-icon whatsapp-icon" style={{ display: 'flex' }}><MessageCircleIcon className="icon-sm" style={{ width: '18px', height: '18px' }} /></span>
                واتساب
              </label>
              <div className="contact-input-wrap">
                <span className="contact-prefix" style={{ color: '#25d366' }}>+</span>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="966500000000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  dir="ltr"
                  inputMode="numeric"
                />
              </div>
              <span className="modal-field-hint">رقم الهاتف بدون + (مع كود الدولة)</span>
            </div>

            {/* Telegram */}
            <div className="modal-field contact-field">
              <label className="modal-label">
                <span className="contact-platform-icon telegram-icon" style={{ display: 'flex' }}><SendIcon className="icon-sm" style={{ width: '18px', height: '18px' }} /></span>
                تيليجرام
              </label>
              <div className="contact-input-wrap">
                <span className="contact-prefix" style={{ color: '#0088cc' }}>@</span>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="username"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value.replace('@', ''))}
                  dir="ltr"
                />
              </div>
              <span className="modal-field-hint">اليوزرنيم بدون @</span>
            </div>

            {/* G2G */}
            <div className="modal-field contact-field contact-field-full">
              <label className="modal-label">
                <span className="contact-platform-icon g2g-icon" style={{ display: 'flex' }}><ShoppingCartIcon className="icon-sm" style={{ width: '18px', height: '18px' }} /></span>
                رابط G2G
              </label>
              <input
                type="url"
                className="modal-input"
                placeholder="https://www.g2g.com/seller/..."
                value={g2g}
                onChange={(e) => setG2g(e.target.value)}
                dir="ltr"
              />
              <span className="modal-field-hint">رابط صفحة المورد على موقع G2G</span>
            </div>
          </div>

          {/* Preview */}
          {name.trim() && (
            <div className="modal-supplier-preview">
              <div className="preview-supplier-card">
                <div className="preview-supplier-avatar">
                  {name.trim().charAt(0)}
                </div>
                <div className="preview-supplier-info">
                  <div className="preview-supplier-name">{name.trim()}</div>
                  <div className="preview-contact-badges">
                    {whatsapp && <span className="preview-badge-chip whatsapp-badge flex-row align-center gap-1"><MessageCircleIcon className="icon-xs" /> واتساب</span>}
                    {telegram && <span className="preview-badge-chip telegram-badge flex-row align-center gap-1"><SendIcon className="icon-xs" /> تيليجرام</span>}
                    {g2g && <span className="preview-badge-chip g2g-badge flex-row align-center gap-1"><ShoppingCartIcon className="icon-xs" /> G2G</span>}
                    {!whatsapp && !telegram && !g2g && (
                      <span className="preview-badge-chip empty-badge">لا توجد بيانات تواصل</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn modal-btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="modal-btn modal-btn-success-green" onClick={handleSubmit}>
            <span style={{ display: 'flex' }}><CheckIcon className="icon-sm" /></span> إضافة المورد
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

export default AddSupplierModal;
