import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircleIcon, SaveIcon, AlertTriangleIcon,
  TrendingDownIcon, TrendingUpIcon, ChevronDownIcon,
  XIcon, InfoIcon, ZapIcon
} from '../Icons';

const fmt    = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const MECHANISM_OPTIONS = [
  { id: 'costplus', label: 'التكلفة + هامش',  icon: '📊' },
  { id: 'value',    label: 'التسعير بالقيمة', icon: '💎' },
  { id: 'psych99',  label: 'نفسي (.99)',       icon: '🧠' },
  { id: 'psych9',   label: 'نفسي (ينتهي بـ9)', icon: '🧠' },
];

function computeSuggested(mechanism, baseSAR, costs, params) {
  let fixedCosts = 0, percentCosts = 0;
  costs.filter(c => c.active).forEach(c => {
    if (c.type === 'fixed') fixedCosts += c.value;
    else if (c.type === 'percentage') percentCosts += c.value / 100;
  });
  const marginDec  = (parseFloat(params.margin) || 20) / 100;
  const denominator = 1 - marginDec - percentCosts;
  const costPlus    = denominator > 0 ? (baseSAR + fixedCosts) / denominator : 0;
  if (mechanism === 'costplus') return costPlus;
  if (mechanism === 'value')    return (parseFloat(params.perceivedValue) || 100) * ((parseFloat(params.valueRatio) || 20) / 100);
  if (mechanism === 'psych99')  return Math.floor(costPlus) + 0.99;
  if (mechanism === 'psych9')   return Math.floor(costPlus / 10) * 10 + 9;
  return costPlus;
}

function computeTotalCost(baseSAR, costs) {
  let fixed = 0, percents = 0;
  costs.filter(c => c.active).forEach(c => {
    if (c.type === 'fixed') fixed += c.value;
    else if (c.type === 'percentage') percents += c.value / 100;
  });
  const marginDec   = 0.20;
  const denominator = 1 - marginDec - percents;
  const suggested   = denominator > 0 ? (baseSAR + fixed) / denominator : 0;
  return baseSAR + fixed + (suggested * percents);
}

function computeFixedCosts(costs) {
  let fixed = 0;
  costs.filter(c => c.active && c.type === 'fixed').forEach(c => { fixed += c.value; });
  return fixed;
}

function computePercentCosts(costs) {
  let pct = 0;
  costs.filter(c => c.active && c.type === 'percentage').forEach(c => { pct += c.value; });
  return pct;
}

function getPricingStatus(finalPrice, totalCost, suggested) {
  if (!finalPrice || finalPrice <= 0) return null;
  if (finalPrice < totalCost)       return { label: 'تحت التكلفة', type: 'danger',  icon: <TrendingDownIcon  className="icon-xs" /> };
  if (finalPrice < suggested)       return { label: 'يحتاج رفع',  type: 'warning', icon: <AlertTriangleIcon className="icon-xs" /> };
  if (finalPrice > suggested * 1.5) return { label: 'مرتفع جداً', type: 'info',    icon: <TrendingUpIcon    className="icon-xs" /> };
  return                                   { label: 'مثالي',        type: 'success', icon: <CheckCircleIcon   className="icon-xs" /> };
}

function getPricingExplanation(baseSAR, costs, rowMech, officialSAR, finalPrice, totalCost, suggested) {
  const activeCosts  = costs.filter(c => c.active);
  let fixedTotal = 0, percentTotal = 0;
  activeCosts.forEach(c => {
    if (c.type === 'fixed') fixedTotal += c.value;
    else if (c.type === 'percentage') percentTotal += c.value / 100;
  });
  const percentAmountOnSuggested = suggested > 0 ? suggested * percentTotal : 0;

  const margin20Denom = 1 - 0.20 - percentTotal;
  const idealPrice    = margin20Denom > 0 ? (baseSAR + fixedTotal) / margin20Denom : 0;
  const minPrice      = totalCost;
  const maxPrice      = suggested * 1.5;
  const profitMargin  = finalPrice > 0 ? ((finalPrice - totalCost) / finalPrice) * 100 : 0;

  let reasonTitle = '';
  let reasonDetail = '';
  let reasonType   = 'success';

  if (!finalPrice || finalPrice <= 0) {
    reasonTitle  = 'لم يتم تحديد سعر نهائي بعد';
    reasonDetail = 'أدخل السعر النهائي في حقل السعر النهائي واضغط حفظ لتفعيل التقييم.';
    reasonType   = 'muted';
  } else if (finalPrice < totalCost) {
    reasonTitle  = 'السعر أقل من إجمالي التكلفة';
    reasonDetail = `السعر النهائي ${fmt(finalPrice)} ر.س أقل من إجمالي التكلفة ${fmt(totalCost)} ر.س بفارق ${fmt(totalCost - finalPrice)} ر.س، مما يعني أنك ستبيع بخسارة.`;
    reasonType   = 'danger';
  } else if (finalPrice < suggested) {
    reasonTitle  = 'السعر أقل من السعر المقترح';
    reasonDetail = `السعر النهائي ${fmt(finalPrice)} ر.س يغطي التكلفة لكنه أقل من السعر المقترح ${fmt(suggested)} ر.س بفارق ${fmt(suggested - finalPrice)} ر.س. هامش ربحك الحالي ${fmtPct(profitMargin)}% أقل من المستهدف.`;
    reasonType   = 'warning';
  } else if (finalPrice > suggested * 1.5) {
    reasonTitle  = 'السعر مرتفع جداً مقارنة بالمقترح';
    reasonDetail = `السعر النهائي ${fmt(finalPrice)} ر.س يتجاوز الحد الأعلى المنطقي ${fmt(suggested * 1.5)} ر.س (1.5× المقترح). قد يؤثر ذلك على تنافسية المنتج.`;
    reasonType   = 'info';
  } else {
    reasonTitle  = 'السعر في النطاق المثالي';
    reasonDetail = `السعر النهائي ${fmt(finalPrice)} ر.س يقع بين السعر المقترح ${fmt(suggested)} ر.س والحد الأعلى ${fmt(suggested * 1.5)} ر.س. هامش الربح ${fmtPct(profitMargin)}%.`;
    reasonType   = 'success';
  }

  const suggestions = [];
  if (minPrice > 0) suggestions.push({
    label: 'الحد الأدنى (تغطية التكلفة)',
    value: minPrice,
    note: 'أدنى سعر يغطي جميع التكاليف دون ربح',
    type: 'neutral',
  });
  if (idealPrice > 0) suggestions.push({
    label: 'السعر المثالي (هامش 20%)',
    value: idealPrice,
    note: 'السعر الأمثل لتحقيق هامش ربح 20% بعد كل التكاليف',
    type: 'good',
  });
  if (maxPrice > 0) suggestions.push({
    label: 'الحد الأعلى المنطقي (×1.5)',
    value: maxPrice,
    note: 'تجاوز هذا السعر قد يضعف تنافسية المنتج',
    type: 'caution',
  });

  return {
    reasonTitle,
    reasonDetail,
    reasonType,
    stats: {
      baseSAR,
      fixedTotal,
      percentTotal: percentTotal * 100,
      percentAmountOnSuggested,
      totalCost,
      suggested,
      finalPrice,
      profitMargin,
      officialSAR,
      activeCostsCount: activeCosts.length,
    },
    suggestions,
  };
}

/* ── Pricing Status Popup (modal) ── */
function PricingStatusPopup({ data, onClose }) {
  const overlayRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const { reasonTitle, reasonDetail, reasonType, stats, suggestions } = data;

  const typeColorMap = {
    danger: 'var(--accent-red, #f94b60)',
    warning: 'var(--accent-orange, #e68a00)',
    info: 'var(--accent-blue, #4b9cf9)',
    success: 'var(--accent-green, #3ecf8e)',
    muted: 'var(--text-secondary)',
  };
  const accentColor = typeColorMap[reasonType] || typeColorMap.muted;

  return (
    <div
      className="psp-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="psp-modal" dir="rtl">
        {/* Header */}
        <div className="psp-header" style={{ borderColor: accentColor }}>
          <div className="psp-header-title">
            <InfoIcon className="icon-sm" style={{ color: accentColor }} />
            <span>تحليل التقييم</span>
          </div>
          <button className="psp-close-btn" onClick={onClose} title="إغلاق">
            <XIcon className="icon-sm" />
          </button>
        </div>

        <div className="psp-body">
          {/* Section 1 — Why */}
          <div className="psp-section">
            <div className="psp-section-label">سبب التقييم</div>
            <div className="psp-reason-card" style={{ borderColor: accentColor, background: `${accentColor}12` }}>
              <span className="psp-reason-title" style={{ color: accentColor }}>{reasonTitle}</span>
              <span className="psp-reason-detail">{reasonDetail}</span>
            </div>
          </div>

          {/* Section 2 — Stats */}
          <div className="psp-section">
            <div className="psp-section-label">إحصاءات الخطة</div>
            <div className="psp-stats-grid">
              <div className="psp-stat-row">
                <span className="psp-stat-lbl">سعر المورد</span>
                <span className="psp-stat-val">{stats.baseSAR > 0 ? `${fmt(stats.baseSAR)} ر.س` : '—'}</span>
              </div>
              <div className="psp-stat-row">
                <span className="psp-stat-lbl">التكاليف الثابتة</span>
                <span className="psp-stat-val">{stats.fixedTotal > 0 ? `${fmt(stats.fixedTotal)} ر.س` : 'لا يوجد'}</span>
              </div>
              <div className="psp-stat-row">
                <span className="psp-stat-lbl">التكاليف النسبية</span>
                <span className="psp-stat-val">
                  {stats.percentTotal > 0
                    ? `${fmtPct(stats.percentTotal)}% (≈ ${fmt(stats.percentAmountOnSuggested)} ر.س)`
                    : 'لا يوجد'}
                </span>
              </div>
              <div className="psp-stat-row psp-stat-row-highlight">
                <span className="psp-stat-lbl">إجمالي التكلفة</span>
                <span className="psp-stat-val psp-stat-bold">{stats.totalCost > 0 ? `${fmt(stats.totalCost)} ر.س` : '—'}</span>
              </div>
              <div className="psp-stat-row">
                <span className="psp-stat-lbl">السعر المقترح</span>
                <span className="psp-stat-val">{stats.suggested > 0 ? `${fmt(stats.suggested)} ر.س` : '—'}</span>
              </div>
              <div className="psp-stat-row psp-stat-row-highlight">
                <span className="psp-stat-lbl">السعر النهائي</span>
                <span className="psp-stat-val psp-stat-bold" style={{ color: accentColor }}>
                  {stats.finalPrice > 0 ? `${fmt(stats.finalPrice)} ر.س` : '—'}
                </span>
              </div>
              <div className="psp-stat-row">
                <span className="psp-stat-lbl">هامش الربح الحالي</span>
                <span className={`psp-stat-val psp-stat-bold ${stats.profitMargin < 0 ? 'psp-red' : stats.profitMargin < 15 ? 'psp-amber' : 'psp-green'}`}>
                  {stats.finalPrice > 0 ? `${fmtPct(stats.profitMargin)}%` : '—'}
                </span>
              </div>
              {stats.officialSAR > 0 && (
                <div className="psp-stat-row psp-stat-comparison">
                  <span className="psp-stat-lbl">السعر الرسمي <span className="psp-comparison-tag">مقارنة فقط</span></span>
                  <span className="psp-stat-val psp-stat-muted">{fmt(stats.officialSAR)} ر.س</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3 — Suggestions */}
          <div className="psp-section">
            <div className="psp-section-label">مقترحات</div>
            <div className="psp-suggestions-list">
              {suggestions.map((s, i) => (
                <div key={i} className={`psp-suggestion psp-sug-${s.type}`}>
                  <div className="psp-sug-header">
                    <ZapIcon className="icon-xs psp-sug-icon" />
                    <span className="psp-sug-label">{s.label}</span>
                    <span className="psp-sug-value">{fmt(s.value)} ر.س</span>
                  </div>
                  <span className="psp-sug-note">{s.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mechanism param inline inputs ── */
function MechanismParamInputs({ mechanism, params, onChange }) {
  if (mechanism === 'value') {
    return (
      <div className="fpm-mech-params">
        <div className="fpm-mech-param-group">
          <label className="fpm-mech-param-label">قيمة</label>
          <input className="fpm-mech-param-input" type="number" min="0"
            value={params.perceivedValue ?? 100}
            onChange={e => onChange({ perceivedValue: e.target.value })} />
        </div>
        <div className="fpm-mech-param-group">
          <label className="fpm-mech-param-label">نسبة%</label>
          <input className="fpm-mech-param-input" type="number" min="0" max="100"
            value={params.valueRatio ?? 20}
            onChange={e => onChange({ valueRatio: e.target.value })} />
        </div>
      </div>
    );
  }
  return (
    <div className="fpm-mech-params">
      <label className="fpm-mech-param-label">هامش%</label>
      <input className="fpm-mech-param-input" type="number" min="0" max="99"
        value={params.margin ?? 20}
        onChange={e => onChange({ margin: e.target.value })} />
    </div>
  );
}

/* ── Plan Sub-Row ── */
function PlanRow({
  planKey, plan, getDurationLabel, baseSAR, costs,
  rowMech, setRowMechs, localPrices, setLocalPrices,
  finalPrices, onSetFinalPrices, exchangeRate,
  onOpenPopup,
}) {
  const totalCost      = computeTotalCost(baseSAR, costs);
  const suggested      = computeSuggested(rowMech.mechanism, baseSAR, costs, rowMech);
  const officialSAR    = (plan.officialPriceUsd || 0) * exchangeRate;
  const finalVal       = parseFloat(localPrices[planKey]);
  const savedFinal     = finalPrices[planKey];
  const isSet          = savedFinal !== undefined;
  const priceForMargin = isSet && savedFinal > 0 ? savedFinal : 0;
  const profitMargin   = priceForMargin > 0 ? ((priceForMargin - totalCost) / priceForMargin) * 100 : 0;
  const pricingStatus  = isSet && priceForMargin > 0 ? getPricingStatus(priceForMargin, totalCost, suggested) : null;
  const diffFromOfficial = officialSAR > 0 && priceForMargin > 0 ? priceForMargin - officialSAR : null;

  const handleSave = () => {
    const val = parseFloat(localPrices[planKey]);
    if (!isNaN(val) && val > 0) onSetFinalPrices({ ...finalPrices, [planKey]: val });
  };
  const handleClear = () => {
    const updated = { ...finalPrices };
    delete updated[planKey];
    onSetFinalPrices(updated);
    setLocalPrices(prev => ({ ...prev, [planKey]: '' }));
  };

  const handleStatusClick = () => {
    if (!pricingStatus) return;
    const explanation = getPricingExplanation(baseSAR, costs, rowMech, officialSAR, priceForMargin, totalCost, suggested);
    onOpenPopup(explanation);
  };

  return (
    <div className="fpm-plan-row">
      {/* Duration */}
      <div className="fpm-plan-col fpm-plan-col-duration">
        <span className="fpm-plan-badge">{getDurationLabel(plan.durationId)}</span>
      </div>

      {/* Supplier price */}
      <div className="fpm-plan-col fpm-plan-col-price">
        <span className="fpm-plan-val">{baseSAR > 0 ? `${fmt(baseSAR)} ر.س` : '—'}</span>
      </div>

      {/* Official price — comparison only */}
      <div className="fpm-plan-col fpm-plan-col-price">
        {officialSAR > 0 ? (
          <div className="fpm-official-wrap">
            <span className="fpm-plan-val fpm-official-val">{fmt(officialSAR)} ر.س</span>
            {diffFromOfficial !== null && (
              <span className={`fpm-official-diff ${diffFromOfficial > 0 ? 'above' : diffFromOfficial < 0 ? 'below' : 'equal'}`}>
                {diffFromOfficial > 0 ? `+${fmt(diffFromOfficial)}` : fmt(diffFromOfficial)}
              </span>
            )}
          </div>
        ) : (
          <span className="fpm-empty-dash">—</span>
        )}
      </div>

      {/* Total cost */}
      <div className="fpm-plan-col fpm-plan-col-price">
        <span className="fpm-plan-val">{totalCost > 0 ? `${fmt(totalCost)} ر.س` : '—'}</span>
      </div>

      {/* Mechanism selector */}
      <div className="fpm-plan-col fpm-plan-col-mech">
        <select
          className="fpm-mech-select"
          value={rowMech.mechanism}
          onChange={e => setRowMechs(prev => ({ ...prev, [planKey]: { ...prev[planKey], mechanism: e.target.value } }))}
        >
          {MECHANISM_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
          ))}
        </select>
      </div>

      {/* Mechanism params */}
      <div className="fpm-plan-col fpm-plan-col-params">
        <MechanismParamInputs
          mechanism={rowMech.mechanism}
          params={rowMech}
          onChange={fields => setRowMechs(prev => ({ ...prev, [planKey]: { ...prev[planKey], ...fields } }))}
        />
      </div>

      {/* Suggested price */}
      <div className="fpm-plan-col fpm-plan-col-suggested">
        {suggested > 0 ? (
          <div className="fpm-suggested-wrap">
            <span className="fpm-suggested-val">{fmt(suggested)} ر.س</span>
            <button
              className="fpm-use-btn"
              title="استخدم هذا السعر كسعر نهائي"
              onClick={() => setLocalPrices(prev => ({ ...prev, [planKey]: fmt(suggested) }))}
            >←</button>
          </div>
        ) : (
          <span className="fpm-empty-dash">—</span>
        )}
      </div>

      {/* Margin */}
      <div className="fpm-plan-col fpm-plan-col-margin">
        {priceForMargin > 0
          ? <span className={`po-margin-badge ${profitMargin >= 0 ? 'positive' : 'negative'}`}>{fmtPct(profitMargin)}%</span>
          : <span className="fpm-empty-dash">—</span>
        }
      </div>

      {/* Final price input */}
      <div className="fpm-plan-col fpm-plan-col-final">
        <div className="fpm-price-input-wrap">
          <input
            className="fpm-price-input"
            type="number" min="0" step="0.01" placeholder="0.00"
            value={localPrices[planKey] ?? (isSet ? savedFinal : '')}
            onChange={e => setLocalPrices(prev => ({ ...prev, [planKey]: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <span className="fpm-currency">ر.س</span>
        </div>
      </div>

      {/* Set status */}
      <div className="fpm-plan-col fpm-plan-col-setstate">
        {isSet
          ? <span className="fpm-status-set"><CheckCircleIcon className="icon-xs" />{fmt(savedFinal)} ر.س</span>
          : <span className="fpm-status-unset">لم يُحدَّد</span>
        }
      </div>

      {/* Status — clickable, shown only after price is saved */}
      <div className="fpm-plan-col fpm-plan-col-status">
        {pricingStatus ? (
          <button
            className={`po-status-badge po-status-${pricingStatus.type} fpm-status-clickable flex-row align-center gap-1`}
            onClick={handleStatusClick}
            title="انقر لعرض تفاصيل التقييم"
            type="button"
          >
            <span style={{ display: 'flex' }}>{pricingStatus.icon}</span>
            {pricingStatus.label}
            <span className="fpm-status-hint">؟</span>
          </button>
        ) : (
          <span className="fpm-empty-dash fpm-status-pending" title={!isSet ? 'احفظ السعر أولاً لتفعيل التقييم' : ''}>
            {!isSet ? 'بعد الحفظ' : '—'}
          </span>
        )}
      </div>

      {/* Save / Clear */}
      <div className="fpm-plan-col fpm-plan-col-actions">
        <button className="fpm-save-row-btn" onClick={handleSave}>حفظ</button>
        {isSet && <button className="fpm-clear-btn" onClick={handleClear} title="مسح">×</button>}
      </div>
    </div>
  );
}

/* ── Product Accordion Row ── */
function ProductAccordionRow({
  prod, durations, suppliers, costs, pricingData, exchangeRate,
  finalPrices, onSetFinalPrices, rowMechs, setRowMechs,
  localPrices, setLocalPrices, isExpanded, onToggle,
  onOpenPopup,
}) {
  const plans = prod.plans || [];

  const getDurationLabel = (id) => {
    const d = durations.find(d => d.id === id);
    return d ? d.label : id;
  };

  const getSupplierBasePrice = (plan) => {
    const savedConfig = pricingData[prod.id] || {};
    const supplierId  = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices[supplierId] || 0) * exchangeRate;
  };

  const setPricesCount = plans.filter(pl => finalPrices[`${prod.id}_${pl.id}`] !== undefined).length;
  const allSet  = setPricesCount === plans.length && plans.length > 0;
  const noneSet = setPricesCount === 0;

  return (
    <div className={`fpm-accordion-item ${isExpanded ? 'fpm-accordion-open' : ''}`}>
      <button className="fpm-accordion-header" onClick={onToggle} type="button">
        <div className="fpm-acc-left">
          <div className={`fpm-acc-chevron ${isExpanded ? 'open' : ''}`}>
            <ChevronDownIcon className="icon-sm" />
          </div>
          <div className="fpm-acc-product-info">
            <span className="fpm-acc-product-name">{prod.name}</span>
            <div className="fpm-acc-meta">
              <span className="fpm-acc-plans-pill">{plans.length} {plans.length === 1 ? 'خطة' : 'خطط'}</span>
              {allSet && <span className="fpm-acc-status-pill fpm-acc-status-done">✓ مكتمل</span>}
              {!allSet && setPricesCount > 0 && (
                <span className="fpm-acc-status-pill fpm-acc-status-partial">{setPricesCount}/{plans.length} تم تسعيره</span>
              )}
              {noneSet && plans.length > 0 && (
                <span className="fpm-acc-status-pill fpm-acc-status-none">لم يُسعَّر</span>
              )}
            </div>
          </div>
        </div>
        <div className="fpm-acc-right">
          {plans.length > 0 && (() => {
            const baseSAR   = getSupplierBasePrice(plans[0]);
            const totalCost = computeTotalCost(baseSAR, costs);
            return totalCost > 0
              ? <span className="fpm-acc-cost-hint">تكلفة أدنى خطة: {fmt(totalCost)} ر.س</span>
              : null;
          })()}
        </div>
      </button>

      <div className="fpm-accordion-body">
        <div className="fpm-plans-header">
          <span className="fpm-plans-col-head fpm-ph-duration">الخطة</span>
          <span className="fpm-plans-col-head fpm-ph-price">سعر المورد</span>
          <span className="fpm-plans-col-head fpm-ph-price">السعر الرسمي</span>
          <span className="fpm-plans-col-head fpm-ph-price">إجمالي التكلفة</span>
          <span className="fpm-plans-col-head fpm-ph-mech">آلية التسعير</span>
          <span className="fpm-plans-col-head">المعامل</span>
          <span className="fpm-plans-col-head">السعر المقترح</span>
          <span className="fpm-plans-col-head fpm-ph-margin">هامش الربح</span>
          <span className="fpm-plans-col-head">السعر النهائي</span>
          <span className="fpm-plans-col-head fpm-ph-setstate">الحالة</span>
          <span className="fpm-plans-col-head fpm-ph-status">تقييم السعر</span>
          <span className="fpm-plans-col-head fpm-ph-actions">حفظ</span>
        </div>
        {plans.map(plan => {
          const planKey = `${prod.id}_${plan.id}`;
          const baseSAR = getSupplierBasePrice(plan);
          const rowMech = rowMechs[planKey] || { mechanism: 'costplus', margin: 20, perceivedValue: 100, valueRatio: 20 };
          return (
            <PlanRow
              key={planKey}
              planKey={planKey}
              plan={plan}
              getDurationLabel={getDurationLabel}
              baseSAR={baseSAR}
              costs={costs}
              rowMech={rowMech}
              setRowMechs={setRowMechs}
              localPrices={localPrices}
              setLocalPrices={setLocalPrices}
              finalPrices={finalPrices}
              onSetFinalPrices={onSetFinalPrices}
              exchangeRate={exchangeRate}
              onOpenPopup={onOpenPopup}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ── */
function FinalPricesManager({ products, suppliers, durations, costs, pricingData, exchangeRate, finalPrices, onSetFinalPrices }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set(products.slice(0, 1).map(p => p.id)));
  const [rowMechs, setRowMechs] = useState(() => {
    const init = {};
    products.forEach(p => p.plans?.forEach(pl => {
      init[`${p.id}_${pl.id}`] = { mechanism: 'costplus', margin: 20, perceivedValue: 100, valueRatio: 20 };
    }));
    return init;
  });
  const [localPrices, setLocalPrices] = useState({});
  const [popupData, setPopupData]     = useState(null);

  useEffect(() => {
    const init = {}, mechInit = {};
    products.forEach(p => p.plans?.forEach(pl => {
      const key = `${p.id}_${pl.id}`;
      const existing = finalPrices[key];
      init[key] = existing !== undefined ? String(existing) : '';
      if (!rowMechs[key]) mechInit[key] = { mechanism: 'costplus', margin: 20, perceivedValue: 100, valueRatio: 20 };
    }));
    setLocalPrices(init);
    if (Object.keys(mechInit).length > 0) setRowMechs(prev => ({ ...prev, ...mechInit }));
  }, [products]);

  const toggleProduct     = (id) => setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleExpandAll   = () => setExpandedIds(new Set(products.map(p => p.id)));
  const handleCollapseAll = () => setExpandedIds(new Set());

  const handleSaveAll = () => {
    const updated = { ...finalPrices };
    Object.entries(localPrices).forEach(([key, val]) => {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) updated[key] = n;
    });
    onSetFinalPrices(updated);
  };

  const totalSet    = Object.keys(finalPrices).length;
  const totalPlans  = products.reduce((s, p) => s + (p.plans?.length || 0), 0);
  const coveragePct = totalPlans > 0 ? Math.round((totalSet / totalPlans) * 100) : 0;

  return (
    <div className="fpm-container">
      <div className="fpm-header">
        <div>
          <div className="fpm-title">تفاصيل التسعير والأسعار النهائية</div>
          <div className="fpm-subtitle">
            اضبط آلية التسعير لكل خطة واحفظ السعر المعتمد •{' '}
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{totalSet}</span>/{totalPlans} خطة ({coveragePct}% مكتمل)
          </div>
        </div>
        <div className="fpm-header-actions">
          <button className="fpm-ghost-btn" onClick={handleExpandAll}>توسيع الكل</button>
          <button className="fpm-ghost-btn" onClick={handleCollapseAll}>طي الكل</button>
          <button className="fpm-save-all-btn" onClick={handleSaveAll}>
            <SaveIcon className="icon-sm" />
            حفظ الكل
          </button>
        </div>
      </div>

      <div className="fpm-progress-bar-wrap">
        <div className="fpm-progress-bar-track">
          <div className="fpm-progress-bar-fill" style={{ width: `${coveragePct}%` }} />
        </div>
        <span className="fpm-progress-label">{coveragePct}%</span>
      </div>

      <div className="fpm-accordion-list">
        {products.map(prod => (
          <ProductAccordionRow
            key={prod.id}
            prod={prod}
            durations={durations}
            suppliers={suppliers}
            costs={costs}
            pricingData={pricingData}
            exchangeRate={exchangeRate}
            finalPrices={finalPrices}
            onSetFinalPrices={onSetFinalPrices}
            rowMechs={rowMechs}
            setRowMechs={setRowMechs}
            localPrices={localPrices}
            setLocalPrices={setLocalPrices}
            isExpanded={expandedIds.has(prod.id)}
            onToggle={() => toggleProduct(prod.id)}
            onOpenPopup={setPopupData}
          />
        ))}
      </div>

      {/* Single top-level pricing status popup */}
      {popupData && (
        <PricingStatusPopup data={popupData} onClose={() => setPopupData(null)} />
      )}
    </div>
  );
}

export default FinalPricesManager;
