import { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function ModalOverlay({ onClose, children, className = '' }) {
  const overlayRef = useRef(null);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current && onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div
      className={`modal-overlay ${className}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.getElementById('modal-root') || document.body
  );
}
