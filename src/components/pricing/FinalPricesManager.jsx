import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, SaveIcon, AlertTriangleIcon, TrendingDownIcon, TrendingUpIcon, ClipboardIcon, CalculatorIcon, DiamondIcon, LightbulbIcon } from '../Icons';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const MECHANISM_OPTIONS = [
  { id: 'costplus', label: 'التكلفة + هامش', icon: '📊' },
  { id: 'value', label: 'التسعير بالقيمة', icon: '💎' },
  { id: 'psych99', label: 'نفسي (.99)', icon: '🧠' },
  { id: 'psych9', label: 'نفسي (ينتهي بـ9)', icon: '🧠' },
];

function computeSuggested(mechanism, baseSAR, costs, rowParams) {
  let fixedCosts = 0;
  let percentCosts = 0;
  costs.filter(c => c.active).forEach(c => {
    if (c.type === 'fixed') fixedCosts += c.value;
    else if (c.type === 'percentage') percentCosts += c.value / 100;
  });

  const marginDec = (parseFloat(rowParams.margin) || 20) / 100;
  const denominator = 1 - marginDec - percentCosts;
  const costPlus = denominator > 0 ? (baseSAR + fixedCosts) / denominator : 0;

  if (mechanism === 'costplus') return costPlus;
  if (mechanism === 'value') {
    const pv = parseFloat(rowParams.perceivedValue) || 100;
    const vr = parseFloat(rowParams.valueRatio) || 20;
    return pv * (vr / 100);
  }
  if (mechanism === 'psych99') {
    return Math.floor(costPlus) + 0.99;
  }
  if (mechanism === 'psych9') {
    return Math.floor(costPlus / 10) * 10 + 9;
  }
  return costPlus;
}

function computeTotalCost(baseSAR, costs) {
  let fixedCosts = 0;
  let percentCosts = 0;
  costs.filter(c => c.active).forEach(c => {
    if (c.type === 'fixed') fixedCosts += c.value;
    else if (c.type === 'percentage') percentCosts += c.value / 100;
  });
  const marginDec = 0.20;
  const denominator = 1 - marginDec - percentCosts;
  const suggested = denominator > 0 ? (baseSAR + fixedCosts) / denominator : 0;
  return baseSAR + fixedCosts + (suggested * percentCosts);
}

function getPricingStatus(finalPrice, totalCost, suggested) {
  if (!finalPrice || finalPrice <= 0) return null;
  if (finalPrice < totalCost) return { label: 'تحت التكلفة', type: 'danger', icon: <TrendingDownIcon className="icon-xs" /> };
  if (finalPrice < suggested) return { label: 'يحتاج رفع', type: 'warning', icon: <AlertTriangleIcon className="icon-xs" /> };
  if (finalPrice > suggested * 1.5) return { label: 'مرتفع جداً', type: 'info', icon: <TrendingUpIcon className="icon-xs" /> };
  return { label: 'مثالي', type: 'success', icon: <CheckCircleIcon className="icon-xs" /> };
}

function MechanismParamInputs({ mechanism, params, onChange }) {
  if (mechanism === 'costplus' || mechanism === 'psych99' || mechanism === 'psych9') {
    return (
      <div className="fpm-mech-params">
        <label className="fpm-mech-param-label">هامش %</label>
        <input
          className="fpm-mech-param-input"
          type="number"
          min="0"
          max="99"
          value={params.margin ?? 20}
          onChange={e => onChange({ margin: e.target.value })}
        />
      </div>
    );
  }
  if (mechanism === 'value') {
    return (
      <div className="fpm-mech-params">
        <div className="fpm-mech-param-group">
          <label className="fpm-mech-param-label">قيمة مدركة</label>
          <input
            className="fpm-mech-param-input"
            type="number"
            min="0"
            value={params.perceivedValue ?? 100}
            onChange={e => onChange({ perceivedValue: e.target.value })}
          />
        </div>
        <div className="fpm-mech-param-group">
          <label className="fpm-mech-param-label">نسبة %</label>
          <input
            className="fpm-mech-param-input"
            type="number"
            min="0"
            max="100"
            value={params.valueRatio ?? 20}
            onChange={e => onChange({ valueRatio: e.target.value })}
          />
        </div>
      </div>
    );
  }
  return null;
}

function FinalPricesManager({ products, suppliers, durations, costs, pricingData, exchangeRate, finalPrices, onSetFinalPrices }) {
  const getDurationLabel = (id) => {
    const d = durations.find(d => d.id === id);
    return d ? d.label : id;
  };

  const getSupplierBasePrice = (prod, plan) => {
    if (!plan) {
      if (!prod.plans || prod.plans.length === 0) return 0;
      plan = prod.plans[0];
    }
    const savedConfig = pricingData[prod.id] || {};
    const supplierId = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices[supplierId] || 0) * exchangeRate;
  };

  // Per-row mechanism state: { [key]: { mechanism, margin, perceivedValue, valueRatio } }
  const [rowMechs, setRowMechs] = useState(() => {
    const init = {};
    products.forEach(p => {
      p.plans?.forEach(pl => {
        const key = `${p.id}_${pl.id}`;
        init[key] = { mechanism: 'costplus', margin: 20, perceivedValue: 100, valueRatio: 20 };
      });
    });
    return init;
  });

  // Final price inputs
  const [localPrices, setLocalPrices] = useState({});

  useEffect(() => {
    const init = {};
    const mechInit = {};
    products.forEach(p => {
      p.plans?.forEach(pl => {
        const key = `${p.id}_${pl.id}`;
        const existing = finalPrices[key];
        init[key] = existing !== undefined ? String(existing) : '';
        if (!rowMechs[key]) {
          mechInit[key] = { mechanism: 'costplus', margin: 20, perceivedValue: 100, valueRatio: 20 };
        }
      });
    });
    setLocalPrices(init);
    if (Object.keys(mechInit).length > 0) {
      setRowMechs(prev => ({ ...prev, ...mechInit }));
    }
  }, [products]);

  const handlePriceChange = (key, val) => setLocalPrices(prev => ({ ...prev, [key]: val }));

  const handleMechChange = (key, field, val) => {
    setRowMechs(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  };

  const handleUseSuggested = (key, suggested) => {
    setLocalPrices(prev => ({ ...prev, [key]: fmt(suggested) }));
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
    Object.entries(localPrices).forEach(([key, val]) => {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) updated[key] = n;
    });
    onSetFinalPrices(updated);
  };

  const totalSet = Object.keys(finalPrices).length;
  const totalPlans = products.reduce((s, p) => s + (p.plans?.length || 0), 0);

  return (
    <div className="fpm-container">
      <div className="fpm-header">
        <div>
          <div className="fpm-title">تفاصيل التسعير والأسعار النهائية</div>
          <div className="fpm-subtitle">
            اضبط آلية التسعير لكل خطة واحفظ السعر المعتمد النهائي •{' '}
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{totalSet}</span> / {totalPlans} خطة تم تحديد سعرها
          </div>
        </div>
        <button className="fpm-save-all-btn" onClick={handleSaveAll}>
          <SaveIcon className="icon-sm" />
          حفظ الكل
        </button>
      </div>

      <div className="fpm-table-card">
        <div className="po-table-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <span className="po-table-icon flex-row align-center justify-center"><ClipboardIcon className="icon-sm" /></span>
            جدول تسعير المنتجات الموحّد
          </h3>
          <span className="po-table-count">{products.length} منتج — {totalPlans} خطة</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="fpm-table">
            <thead>
              <tr>
                <th className="fpm-th">المنتج</th>
                <th className="fpm-th">الخطة</th>
                <th className="fpm-th">سعر المورد</th>
                <th className="fpm-th">إجمالي التكلفة</th>
                <th className="fpm-th fpm-th-mech">آلية التسعير + السعر المقترح</th>
                <th className="fpm-th">هامش الربح</th>
                <th className="fpm-th">تقييم السعر</th>
                <th className="fpm-th">السعر النهائي (ر.س)</th>
                <th className="fpm-th">الحالة</th>
                <th className="fpm-th">حفظ</th>
              </tr>
            </thead>
            <tbody>
              {products.map(prod =>
                (prod.plans || []).map((plan, pi) => {
                  const key = `${prod.id}_${plan.id}`;
                  const baseSAR = getSupplierBasePrice(prod, plan);
                  const totalCost = computeTotalCost(baseSAR, costs);
                  const rowMech = rowMechs[key] || { mechanism: 'costplus', margin: 20, perceivedValue: 100, valueRatio: 20 };
                  const suggested = computeSuggested(rowMech.mechanism, baseSAR, costs, rowMech);
                  const finalVal = parseFloat(localPrices[key]);
                  const savedFinal = finalPrices[key];
                  const isSet = savedFinal !== undefined;
                  const priceForMargin = isSet ? savedFinal : (isNaN(finalVal) ? 0 : finalVal);
                  const profitMargin = priceForMargin > 0 ? ((priceForMargin - totalCost) / priceForMargin) * 100 : 0;
                  const pricingStatus = getPricingStatus(priceForMargin, totalCost, suggested);

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
                      <td className="fpm-td fpm-ref-price">
                        {totalCost > 0 ? `${fmt(totalCost)} ر.س` : '—'}
                      </td>
                      <td className="fpm-td fpm-mech-cell">
                        <div className="fpm-mech-row">
                          <select
                            className="fpm-mech-select"
                            value={rowMech.mechanism}
                            onChange={e => handleMechChange(key, 'mechanism', e.target.value)}
                          >
                            {MECHANISM_OPTIONS.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
                            ))}
                          </select>
                          <MechanismParamInputs
                            mechanism={rowMech.mechanism}
                            params={rowMech}
                            onChange={(fields) => setRowMechs(prev => ({ ...prev, [key]: { ...prev[key], ...fields } }))}
                          />
                          <div className="fpm-suggested-wrap">
                            <span className="fpm-suggested-val">
                              {suggested > 0 ? `${fmt(suggested)} ر.س` : '—'}
                            </span>
                            {suggested > 0 && (
                              <button
                                className="fpm-use-btn"
                                title="استخدم هذا السعر كسعر نهائي"
                                onClick={() => handleUseSuggested(key, suggested)}
                              >
                                ←
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="fpm-td">
                        {priceForMargin > 0 ? (
                          <span className={`po-margin-badge ${profitMargin > 0 ? 'positive' : 'negative'}`}>
                            {fmtPct(profitMargin)}%
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="fpm-td">
                        {pricingStatus ? (
                          <span className={`po-status-badge po-status-${pricingStatus.type} flex-row align-center gap-1`}>
                            <span style={{ display: 'flex' }}>{pricingStatus.icon}</span>
                            {pricingStatus.label}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td className="fpm-td">
                        <div className="fpm-price-input-wrap">
                          <input
                            className="fpm-price-input"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={localPrices[key] ?? (isSet ? savedFinal : '')}
                            onChange={e => handlePriceChange(key, e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveRow(key)}
                          />
                          <span className="fpm-currency">ر.س</span>
                        </div>
                      </td>
                      <td className="fpm-td">
                        {isSet ? (
                          <span className="fpm-status-set">
                            <CheckCircleIcon className="icon-xs" />
                            {fmt(savedFinal)}
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
    </div>
  );
}

export default FinalPricesManager;
