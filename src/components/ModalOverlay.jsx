import { useRef, useEffect, useCallback } from 'react';

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

  return (
    <div
      className={`modal-overlay ${className}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}
