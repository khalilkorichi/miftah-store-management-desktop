import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, SaveIcon, TrashIcon } from '../Icons';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function FinalPricesManager({ products, suppliers, durations, costs, pricingData, exchangeRate, finalPrices, onSetFinalPrices }) {
  const getDurationLabel = (id) => {
    const d = durations.find(d => d.id === id);
    return d ? d.label : id;
  };

  const getSupplierBasePrice = (prod) => {
    if (!prod.plans || prod.plans.length === 0) return 0;
    const plan = prod.plans[0];
    const savedConfig = pricingData[prod.id] || {};
    const supplierId = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices[supplierId] || 0) * exchangeRate;
  };

  const getSuggestedPrice = (prod) => {
    const baseCost = getSupplierBasePrice(prod);
    let fixedCosts = 0;
    let percentCosts = 0;
    costs.filter(c => c.active).forEach(c => {
      if (c.type === 'fixed') fixedCosts += c.value;
      else if (c.type === 'percentage') percentCosts += c.value / 100;
    });
    const marginDec = 0.20;
    const denominator = 1 - marginDec - percentCosts;
    return denominator > 0 ? (baseCost + fixedCosts) / denominator : 0;
  };

  const [localPrices, setLocalPrices] = useState({});

  useEffect(() => {
    const init = {};
    products.forEach(p => {
      p.plans?.forEach(pl => {
        const key = `${p.id}_${pl.id}`;
        const existing = finalPrices[key];
        init[key] = existing !== undefined ? String(existing) : '';
      });
    });
    setLocalPrices(init);
  }, [products]);

  const handleChange = (key, val) => {
    setLocalPrices(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveRow = (key) => {
    const val = parseFloat(localPrices[key]);
    if (!isNaN(val) && val > 0) {
      onSetFinalPrices({ ...finalPrices, [key]: val });
    }
  };

  const handleClearRow = (key) => {
    const updated = { ...finalPrices };
    delete updated[key];
    onSetFinalPrices(updated);
    setLocalPrices(prev => ({ ...prev, [key]: '' }));
  };

  const handleSaveAll = () => {
    const updated = { ...finalPrices };
    let savedCount = 0;
    Object.entries(localPrices).forEach(([key, val]) => {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) {
        updated[key] = n;
        savedCount++;
      }
    });
    onSetFinalPrices(updated);
  };

  const totalSet = Object.keys(finalPrices).length;
  const totalPlans = products.reduce((s, p) => s + (p.plans?.length || 0), 0);

  return (
    <div className="fpm-container">
      <div className="fpm-header">
        <div>
          <div className="fpm-title">الأسعار النهائية المعتمدة</div>
          <div className="fpm-subtitle">
            حدد السعر النهائي لكل خطة — هذه الأسعار تظهر في جميع التقارير •{' '}
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{totalSet}</span> / {totalPlans} خطة تم تحديد سعرها
          </div>
        </div>
        <button className="fpm-save-all-btn" onClick={handleSaveAll}>
          <SaveIcon className="icon-sm" />
          حفظ الكل
        </button>
      </div>

      <div className="fpm-table-card">
        <table className="fpm-table">
          <thead>
            <tr>
              <th className="fpm-th">المنتج</th>
              <th className="fpm-th">الخطة</th>
              <th className="fpm-th">السعر المرجعي (ر.س)</th>
              <th className="fpm-th">السعر المقترح (ر.س)</th>
              <th className="fpm-th">السعر النهائي (ر.س)</th>
              <th className="fpm-th">الحالة</th>
              <th className="fpm-th">حفظ</th>
            </tr>
          </thead>
          <tbody>
            {products.map(prod =>
              (prod.plans || []).map((plan, pi) => {
                const key = `${prod.id}_${plan.id}`;
                const baseSAR = getSupplierBasePrice(prod);
                const suggested = getSuggestedPrice(prod);
                const isSet = finalPrices[key] !== undefined;
                return (
                  <tr key={key} className="fpm-tr">
                    {pi === 0 ? (
                      <td className="fpm-td fpm-product-name" rowSpan={prod.plans.length}>
                        {prod.name}
                      </td>
                    ) : null}
                    <td className="fpm-td">
                      <span className="fpm-plan-badge">{getDurationLabel(plan.durationId)}</span>
                    </td>
                    <td className="fpm-td fpm-ref-price">
                      {baseSAR > 0 ? `${fmt(baseSAR)} ر.س` : '—'}
                    </td>
                    <td className="fpm-td fpm-ref-price" style={{ color: 'var(--accent-blue)' }}>
                      {suggested > 0 ? `${fmt(suggested)} ر.س` : '—'}
                    </td>
                    <td className="fpm-td">
                      <div className="fpm-price-input-wrap">
                        <input
                          className="fpm-price-input"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={localPrices[key] ?? (isSet ? finalPrices[key] : '')}
                          onChange={e => handleChange(key, e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveRow(key)}
                        />
                        <span className="fpm-currency">ر.س</span>
                      </div>
                    </td>
                    <td className="fpm-td">
                      {isSet ? (
                        <span className="fpm-status-set">
                          <CheckCircleIcon className="icon-xs" />
                          {fmt(finalPrices[key])} ر.س
                        </span>
                      ) : (
                        <span className="fpm-status-unset">لم يُحدَّد</span>
                      )}
                    </td>
                    <td className="fpm-td">
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <button className="fpm-save-row-btn" onClick={() => handleSaveRow(key)}>حفظ</button>
                        {isSet && (
                          <button className="fpm-clear-btn" onClick={() => handleClearRow(key)} title="مسح">×</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FinalPricesManager;
