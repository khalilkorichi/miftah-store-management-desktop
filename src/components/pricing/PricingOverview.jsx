import React from 'react';
import { TrendingDownIcon, TrendingUpIcon, CheckCircleIcon, PackageIcon, BarChartIcon, AlertTriangleIcon } from '../Icons';

const fmtPct = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function PricingOverview({ products, suppliers, costs, exchangeRate, pricingData, finalPrices }) {

  const getSupplierPrice = (prod) => {
    if (!prod || !prod.plans || prod.plans.length === 0) return 0;
    const plan = prod.plans[0];
    const savedConfig = pricingData[prod.id] || {};
    const supplierId = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices[supplierId] || 0) * exchangeRate;
  };

  const calculateCosts = (baseCost) => {
    let fixed = 0;
    let percents = 0;
    costs.filter(c => c.active).forEach(c => {
      if (c.type === 'fixed') fixed += c.value;
      else if (c.type === 'percentage') percents += c.value / 100;
    });
    const marginDec = 0.20;
    const denominator = 1 - marginDec - percents;
    const suggestedPrice = denominator > 0 ? (baseCost + fixed) / denominator : 0;
    const totalCost = baseCost + fixed + (suggestedPrice * percents);
    return { totalCost, suggestedPrice };
  };

  let totalProductsCount = products.length;
  let belowCostCount = 0;
  let totalMarginSum = 0;
  let marginApplicableCount = 0;
  let totalSetPrices = 0;
  let totalPlansCount = 0;

  products.forEach(p => {
    const baseC = getSupplierPrice(p);
    const { totalCost, suggestedPrice } = calculateCosts(baseC);
    p.plans?.forEach(pl => {
      totalPlansCount++;
      const key = `${p.id}_${pl.id}`;
      const finalP = finalPrices?.[key];
      if (finalP) {
        totalSetPrices++;
        const profitMargin = finalP > 0 ? ((finalP - totalCost) / finalP) * 100 : 0;
        if (finalP < totalCost) belowCostCount++;
        if (finalP > 0) {
          totalMarginSum += profitMargin;
          marginApplicableCount++;
        }
      }
    });
  });

  const avgMargin = marginApplicableCount > 0 ? (totalMarginSum / marginApplicableCount) : 0;
  const coveragePercent = totalPlansCount > 0 ? (totalSetPrices / totalPlansCount) * 100 : 0;

  return (
    <div className="po-container">
      <div className="po-header">
        <div className="po-header-text">
          <h2>لوحة التحكم الشاملة للتسعير</h2>
          <p>نظرة عامة على حالة تسعير منتجاتك — انتقل إلى تبويبة <strong>الأسعار النهائية</strong> لضبط وحفظ أسعار المنتجات.</p>
        </div>
      </div>

      <div className="po-kpi-grid">
        <div className="po-kpi-card po-kpi-blue">
          <div className="po-kpi-icon flex-row align-center justify-center"><PackageIcon className="icon-lg" /></div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{totalProductsCount}</span>
            <span className="po-kpi-label">إجمالي المنتجات</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
        <div className={`po-kpi-card ${belowCostCount > 0 ? 'po-kpi-red' : 'po-kpi-green'}`}>
          <div className="po-kpi-icon flex-row align-center justify-center">{belowCostCount > 0 ? <TrendingDownIcon className="icon-lg" /> : <CheckCircleIcon className="icon-lg" />}</div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{belowCostCount}</span>
            <span className="po-kpi-label">أسعار تحت التكلفة</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
        <div className="po-kpi-card po-kpi-green">
          <div className="po-kpi-icon flex-row align-center justify-center"><BarChartIcon className="icon-lg" /></div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{fmtPct(avgMargin)}%</span>
            <span className="po-kpi-label">متوسط هامش الربح</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
        <div className={`po-kpi-card ${coveragePercent < 100 ? 'po-kpi-blue' : 'po-kpi-green'}`}>
          <div className="po-kpi-icon flex-row align-center justify-center">
            {coveragePercent < 100 ? <AlertTriangleIcon className="icon-lg" /> : <CheckCircleIcon className="icon-lg" />}
          </div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{totalSetPrices}/{totalPlansCount}</span>
            <span className="po-kpi-label">خطط تم تسعيرها</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
      </div>

      {belowCostCount > 0 && (
        <div className="po-alert-banner">
          <TrendingDownIcon className="icon-sm" />
          <span>تحذير: {belowCostCount} {belowCostCount === 1 ? 'خطة تسعير' : 'خطط تسعير'} تحت التكلفة — يُرجى مراجعتها في تبويبة <strong>الأسعار النهائية</strong></span>
        </div>
      )}

      {totalSetPrices === 0 && (
        <div className="po-empty-guide">
          <div className="po-empty-guide-icon">💡</div>
          <div>
            <strong>لم يتم تحديد أي أسعار نهائية بعد</strong>
            <p>انتقل إلى تبويبة <strong>الأسعار النهائية</strong> لضبط أسعار منتجاتك باستخدام آليات التسعير المختلفة وحفظ الأسعار المعتمدة.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PricingOverview;
