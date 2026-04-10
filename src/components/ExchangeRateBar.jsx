import { useState } from 'react';
import { CurrencyIcon, CheckIcon, XIcon, EditIcon, ExternalLinkIcon } from './Icons';

function ExchangeRateBar({ exchangeRate, onRateChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempRate, setTempRate] = useState(exchangeRate);

  const handleSubmit = () => {
    const rate = parseFloat(tempRate);
    if (rate > 0) {
      onRateChange(rate);
    }
    setIsEditing(false);
  };

  return (
    <div className="exchange-rate-bar">
      <div className="exchange-content">
        <div className="exchange-label">
          <span className="exchange-icon flex-center"><CurrencyIcon /></span>
          <span>سعر الصرف الحالي:</span>
        </div>
        <div className="exchange-value">
          {isEditing ? (
            <div className="exchange-edit">
              <span className="currency-label">1 دولار =</span>
              <input
                type="number"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                step="0.01"
                min="0"
                autoFocus
                className="exchange-input"
              />
              <span className="currency-label">ريال سعودي</span>
              <button className="btn-confirm flex-center" onClick={handleSubmit}><CheckIcon className="icon-xs" /></button>
              <button className="btn-cancel flex-center" onClick={() => { setIsEditing(false); setTempRate(exchangeRate); }}><XIcon className="icon-xs" /></button>
            </div>
          ) : (
            <div className="exchange-display" dir="ltr" onClick={() => { setIsEditing(true); setTempRate(exchangeRate); }}>
              <button className="btn-edit-rate flex-center" title="تعديل سعر الصرف" onClick={(e) => { e.stopPropagation(); setIsEditing(true); setTempRate(exchangeRate); }}><EditIcon className="icon-xs" /></button>
              <span className="rate-value">1 USD = {exchangeRate} SAR</span>
            </div>
          )}
        </div>
        <div className="exchange-note">
          جميع الأسعار بالريال السعودي تُحسب تلقائياً بناءً على سعر الصرف
          <a
            className="exchange-rate-link"
            href="https://share.google/tkWL6ZeqWVpuQBdWO"
            target="_blank"
            rel="noopener noreferrer"
            title="تحقق من سعر الصرف الحالي على جوجل"
          >
            <ExternalLinkIcon className="icon-xs" />
            <span>سعر الصرف الآن</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default ExchangeRateBar;
