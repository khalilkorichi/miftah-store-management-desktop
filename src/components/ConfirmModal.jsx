import { useEffect, useRef } from 'react';
import { AlertTriangleIcon } from './Icons';
import ModalOverlay from './ModalOverlay';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'نعم، احذف', cancelText = 'إلغاء' }) {
  const modalRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Focus trap + ESC handler
  useEffect(() => {
    if (!isOpen) return;

    // Focus the cancel button on open (safer default)
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClose={onCancel}>
      <div
        className="modal-box confirm-modal-box"
        style={{ maxWidth: '420px', textAlign: 'center' }}
        dir="rtl"
        ref={modalRef}
      >
        {/* Body */}
        <div className="modal-body" style={{ padding: '30px 24px' }}>
          <div className="warning-icon" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center', color: 'var(--accent-red)' }} aria-hidden="true">
            <AlertTriangleIcon style={{ width: '54px', height: '54px' }} />
          </div>

          <h3
            id="confirm-title"
            className="modal-title"
            style={{
              fontSize: '20px',
              fontWeight: '800',
              color: 'var(--text-primary)',
              marginBottom: '14px',
            }}
          >
            {title}
          </h3>

          <p
            id="confirm-message"
            className="modal-text"
            style={{
              fontSize: '14.5px',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
              opacity: 0.9,
              marginBottom: '10px',
            }}
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 24px',
            justifyContent: 'stretch',
          }}
        >
          <button
            ref={confirmBtnRef}
            className="modal-btn modal-btn-danger"
            onClick={onConfirm}
            style={{
              backgroundColor: 'var(--accent-red)',
              color: '#fff',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {confirmText}
          </button>

          <button
            className="modal-btn modal-btn-ghost"
            onClick={onCancel}
            style={{
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
