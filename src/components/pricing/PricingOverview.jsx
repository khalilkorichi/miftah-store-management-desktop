import React from 'react';
import {
  TrendingDownIcon, TrendingUpIcon, CheckCircleIcon,
  PackageIcon, BarChartIcon, AlertTriangleIcon,
  SettingsIcon, DollarSignIcon, TagIcon, CheckIcon, InfoIcon
} from '../Icons';

const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function PricingOverview({ products, suppliers, costs, exchangeRate, pricingData, finalPrices, onGoToFinalPrices }) {

  const getBaseSAR = (prod) => {
    const plan = prod.plans?.[0];
    if (!plan) return 0;
    const savedConfig = pricingData[prod.id] || {};
    const supplierId  = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices?.[supplierId] || 0) * exchangeRate;
  };

  const calcTotalCost = (baseSAR) => {
    let fixed = 0, percents = 0;
    costs.filter(c => c.active).forEach(c => {
      if (c.type === 'fixed')           fixed    += c.value;
      else if (c.type === 'percentage') percents += c.value / 100;
    });
    const marginDec = 0.20;
    const denom = 1 - marginDec - percents;
    const suggested = denom > 0 ? (baseSAR + fixed) / denom : 0;
    return baseSAR + fixed + (suggested * percents);
  };

  /* per-product stats */
  const productStats = products.map(prod => {
    const plans      = prod.plans || [];
    const totalPlans = plans.length;
    let setPrices    = 0;
    let marginSum    = 0;
    let marginCount  = 0;
    let belowCost    = false;
    const baseSAR    = getBaseSAR(prod);
    const totalCost  = calcTotalCost(baseSAR);

    plans.forEach(pl => {
      const key    = `${prod.id}_${pl.id}`;
      const finalP = finalPrices?.[key];
      if (finalP !== undefined) {
        setPrices++;
        const margin = finalP > 0 ? ((finalP - totalCost) / finalP) * 100 : 0;
        marginSum   += margin;
        marginCount++;
        if (finalP < totalCost) belowCost = true;
      }
    });

    const avgMargin = marginCount > 0 ? marginSum / marginCount : null;
    const status    = setPrices === 0 ? 'none' : setPrices === totalPlans ? 'complete' : 'partial';
    return { id: prod.id, name: prod.name, totalPlans, setPrices, avgMargin, belowCost, status };
  });

  /* aggregate KPIs */
  const totalProducts  = products.length;
  const completeCount  = productStats.filter(p => p.status === 'complete').length;
  const partialCount   = productStats.filter(p => p.status === 'partial').length;
  const noneCount      = productStats.filter(p => p.status === 'none').length;
  const belowCostProds = productStats.filter(p => p.belowCost);
  const allPlans       = productStats.reduce((s, p) => s + p.totalPlans, 0);
  const allSetPlans    = productStats.reduce((s, p) => s + p.setPrices, 0);
  const coveragePct    = allPlans > 0 ? (allSetPlans / allPlans) * 100 : 0;
  const marginsArr     = productStats.filter(p => p.avgMargin !== null).map(p => p.avgMargin);
  const avgMarginAll   = marginsArr.length > 0 ? marginsArr.reduce((a, b) => a + b, 0) / marginsArr.length : 0;

  /* progress bar — three product-level buckets */
  const barCompletePct = totalProducts > 0 ? (completeCount / totalProducts) * 100 : 0;
  const barPartialPct  = totalProducts > 0 ? (partialCount  / totalProducts) * 100 : 0;
  const barNonePct     = totalProducts > 0 ? (noneCount     / totalProducts) * 100 : 100;

  /* insights */
  const ranked  = productStats.filter(p => p.avgMargin !== null).sort((a, b) => b.avgMargin - a.avgMargin);
  const top3    = ranked.slice(0, 3);
  const bottom3 = ranked.slice(-3).reverse();

  const allEmpty = allSetPlans === 0;

  return (
    <div className="po-container">

      {/* KPI Cards */}
      <div className="po-kpi-grid">
        <div className="po-kpi-card po-kpi-blue">
          <div className="po-kpi-icon"><PackageIcon className="icon-lg" /></div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{totalProducts}</span>
            <span className="po-kpi-label">إجمالي المنتجات</span>
            <span className="po-kpi-sub">{allPlans} خطة تسعير</span>
          </div>
          <div className="po-kpi-glow" />
        </div>

        <div className={`po-kpi-card ${coveragePct >= 100 ? 'po-kpi-green' : coveragePct > 0 ? 'po-kpi-amber' : 'po-kpi-muted'}`}>
          <div className="po-kpi-icon">
            {coveragePct >= 100 ? <CheckCircleIcon className="icon-lg" /> : <BarChartIcon className="icon-lg" />}
          </div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{fmtPct(coveragePct)}%</span>
            <span className="po-kpi-label">تغطية التسعير</span>
            <span className="po-kpi-sub">{allSetPlans} / {allPlans} خطة</span>
          </div>
          <div className="po-kpi-glow" />
        </div>

        <div className={`po-kpi-card ${avgMarginAll >= 20 ? 'po-kpi-green' : avgMarginAll > 0 ? 'po-kpi-amber' : 'po-kpi-muted'}`}>
          <div className="po-kpi-icon">
            {avgMarginAll >= 20 ? <TrendingUpIcon className="icon-lg" /> : <BarChartIcon className="icon-lg" />}
          </div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{fmtPct(avgMarginAll)}%</span>
            <span className="po-kpi-label">متوسط هامش الربح</span>
            <span className="po-kpi-sub">{marginsArr.length > 0 ? `من ${marginsArr.length} منتج مُسعَّر` : 'لا توجد أسعار محددة'}</span>
          </div>
          <div className="po-kpi-glow" />
        </div>

        <div className={`po-kpi-card ${belowCostProds.length > 0 ? 'po-kpi-red' : 'po-kpi-green'}`}>
          <div className="po-kpi-icon">
            {belowCostProds.length > 0 ? <TrendingDownIcon className="icon-lg" /> : <CheckCircleIcon className="icon-lg" />}
          </div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{belowCostProds.length}</span>
            <span className="po-kpi-label">أسعار تحت التكلفة</span>
            <span className="po-kpi-sub">{belowCostProds.length === 0 ? 'جميع الأسعار سليمة' : 'تحتاج مراجعة عاجلة'}</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
      </div>

      {/* Coverage Progress Bar — product-level: complete / partial / none */}
      <div className="po-progress-card">
        <div className="po-progress-header">
          <span className="po-progress-title">تقدم التسعير — على مستوى المنتجات</span>
          <div className="po-progress-legend">
            <span className="po-leg-dot po-leg-green" />
            <span className="po-leg-txt">مكتمل ({completeCount})</span>
            <span className="po-leg-dot po-leg-amber" />
            <span className="po-leg-txt">جزئي ({partialCount})</span>
            <span className="po-leg-dot po-leg-muted" />
            <span className="po-leg-txt">لم يُسعَّر ({noneCount})</span>
          </div>
        </div>
        <div className="po-progress-bar-track">
          {barCompletePct > 0 && <div className="po-progress-seg po-seg-green" style={{ width: `${barCompletePct}%` }} title={`مكتمل ${fmtPct(barCompletePct)}%`} />}
          {barPartialPct  > 0 && <div className="po-progress-seg po-seg-amber" style={{ width: `${barPartialPct}%`  }} title={`جزئي ${fmtPct(barPartialPct)}%`} />}
          {barNonePct     > 0 && <div className="po-progress-seg po-seg-muted" style={{ width: `${barNonePct}%`    }} title={`لم يُسعَّر ${fmtPct(barNonePct)}%`} />}
        </div>
        <div className="po-progress-counts">
          {barCompletePct > 0 && <span className="po-pct-label po-pct-green">{fmtPct(barCompletePct)}% مكتمل</span>}
          {barPartialPct  > 0 && <span className="po-pct-label po-pct-amber">{fmtPct(barPartialPct)}% جزئي</span>}
          <span className="po-pct-label po-pct-muted">{fmtPct(barNonePct)}% لم يُسعَّر</span>
        </div>
      </div>

      {/* Alert Banner */}
      {belowCostProds.length > 0 && (
        <div className="po-alert-banner po-alert-danger">
          <div className="po-alert-icon"><TrendingDownIcon className="icon-sm" /></div>
          <div className="po-alert-body">
            <span className="po-alert-title">تحذير: {belowCostProds.length} {belowCostProds.length === 1 ? 'منتج' : 'منتجات'} بأسعار تحت التكلفة</span>
            <span className="po-alert-names">{belowCostProds.map(p => p.name).join(' · ')}</span>
          </div>
          <button className="po-alert-nav-btn" onClick={onGoToFinalPrices}>
            انتقل إلى الأسعار النهائية ←
          </button>
        </div>
      )}

      {/* Product Status Grid */}
      <div className="po-section">
        <div className="po-section-header">
          <PackageIcon className="icon-sm" />
          <h3>حالة المنتجات</h3>
          <span className="po-section-count">{totalProducts} منتج</span>
        </div>
        <div className="po-products-grid">
          {productStats.map(p => (
            <div key={p.id} className={`po-prod-card po-prod-${p.status}`}>
              <div className="po-prod-top">
                <span className="po-prod-name">{p.name}</span>
                <span className={`po-prod-badge po-badge-${p.status}`}>
                  {p.status === 'complete' ? '✓ مكتمل' : p.status === 'partial' ? '⚡ جزئي' : '— لم يُسعَّر'}
                </span>
              </div>
              <div className="po-prod-stats">
                <div className="po-prod-stat">
                  <span className="po-prod-stat-val">{p.setPrices}/{p.totalPlans}</span>
                  <span className="po-prod-stat-lbl">خطة</span>
                </div>
                <div className="po-prod-divider" />
                <div className="po-prod-stat">
                  {p.avgMargin !== null
                    ? <><span className={`po-prod-stat-val ${p.avgMargin < 0 ? 'red' : p.avgMargin < 15 ? 'amber' : 'green'}`}>{fmtPct(p.avgMargin)}%</span><span className="po-prod-stat-lbl">هامش</span></>
                    : <><span className="po-prod-stat-val muted">—</span><span className="po-prod-stat-lbl">هامش</span></>
                  }
                </div>
                <div className="po-prod-divider" />
                <div className="po-prod-stat">
                  {p.belowCost
                    ? <span className="po-prod-warn"><AlertTriangleIcon className="icon-xs" /> تحت التكلفة</span>
                    : p.avgMargin !== null
                      ? <span className="po-prod-ok"><CheckIcon className="icon-xs" /> سليم</span>
                      : <span className="po-prod-stat-val muted">—</span>
                  }
                </div>
              </div>
              <div className="po-prod-mini-bar">
                <div className="po-prod-mini-fill" style={{ width: `${p.totalPlans > 0 ? (p.setPrices / p.totalPlans) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Insights */}
      {ranked.length > 0 && (
        <div className="po-insights-row">
          <div className="po-insight-panel po-insight-top">
            <div className="po-insight-header">
              <TrendingUpIcon className="icon-sm" />
              <span>أعلى هامشاً</span>
            </div>
            <div className="po-insight-list">
              {top3.map((p, i) => (
                <div key={p.id} className="po-insight-item">
                  <span className="po-insight-rank">{i + 1}</span>
                  <span className="po-insight-name">{p.name}</span>
                  <span className="po-insight-val green">{fmtPct(p.avgMargin)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="po-insight-panel po-insight-bottom">
            <div className="po-insight-header">
              <TrendingDownIcon className="icon-sm" />
              <span>أدنى هامشاً</span>
            </div>
            <div className="po-insight-list">
              {bottom3.map((p, i) => (
                <div key={p.id} className="po-insight-item">
                  <span className="po-insight-rank">{i + 1}</span>
                  <span className="po-insight-name">{p.name}</span>
                  <span className={`po-insight-val ${p.avgMargin < 0 ? 'red' : p.avgMargin < 15 ? 'amber' : 'green'}`}>{fmtPct(p.avgMargin)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {allEmpty && (
        <div className="po-empty-steps">
          <div className="po-empty-title">
            <InfoIcon className="icon-md" />
            <strong>لم يتم تحديد أي أسعار نهائية بعد</strong>
          </div>
          <p className="po-empty-sub">اتبع هذه الخطوات لإعداد أسعارك بشكل احترافي:</p>
          <div className="po-steps-row">
            <div className="po-step">
              <div className="po-step-num">1</div>
              <DollarSignIcon className="icon-md po-step-icon" />
              <span className="po-step-label">إدارة التكاليف</span>
              <span className="po-step-desc">أضف التكاليف الثابتة والنسبية لمنتجاتك</span>
            </div>
            <div className="po-step-arrow">←</div>
            <div className="po-step">
              <div className="po-step-num">2</div>
              <SettingsIcon className="icon-md po-step-icon" />
              <span className="po-step-label">آليات التسعير</span>
              <span className="po-step-desc">اختر طريقة حساب السعر المقترح</span>
            </div>
            <div className="po-step-arrow">←</div>
            <div className="po-step">
              <div className="po-step-num">3</div>
              <TagIcon className="icon-md po-step-icon" />
              <span className="po-step-label">الأسعار النهائية</span>
              <span className="po-step-desc">راجع واعتمد الأسعار النهائية لكل خطة</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PricingOverview;
