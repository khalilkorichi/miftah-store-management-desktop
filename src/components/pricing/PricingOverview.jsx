import React from 'react';
import { TrendingDownIcon, AlertTriangleIcon, TrendingUpIcon, CheckCircleIcon, SendIcon, PackageIcon, BarChartIcon, ClipboardIcon } from '../Icons';

const fmt = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtSAR = (val) => `${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
const fmtPct = (val) => Number(val).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function PricingOverview({ products, suppliers, costs, exchangeRate, pricingData }) {
  
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

  const currentPriceMock = (prod) => {
    const base = getSupplierPrice(prod);
    return base * 1.5;
  };

  const getStatus = (current, suggested, cost) => {
    if (current < cost) return { label: 'تحت التكلفة', type: 'danger', icon: <TrendingDownIcon className="icon-xs" /> };
    if (current < suggested) return { label: 'يحتاج رفع', type: 'warning', icon: <AlertTriangleIcon className="icon-xs" /> };
    if (current > suggested * 1.5) return { label: 'مرتفع جداً', type: 'info', icon: <TrendingUpIcon className="icon-xs" /> };
    return { label: 'مثالي', type: 'success', icon: <CheckCircleIcon className="icon-xs" /> };
  };

  const handleApplySingle = (productId, price) => {
    alert(`سيتم إرسال السعر ${fmt(price)} للمنتج ${productId} عبر API مسقبلاً...`);
  };

  const handleApplyAll = () => {
    alert(`سيتم تطبيق جميع الأسعار المقترحة وإرسالها لـ API سلة...`);
  };

  let totalProductsCount = products.length;
  let belowCostCount = 0;
  let totalMarginSum = 0;
  let marginApplicableCount = 0;

  products.forEach(p => {
    const baseC = getSupplierPrice(p);
    const { totalCost } = calculateCosts(baseC);
    const currP = currentPriceMock(p);
    const profitMargin = currP > 0 ? ((currP - totalCost) / currP) * 100 : 0;
    
    if (currP < totalCost) belowCostCount++;
    if (currP > 0) {
      totalMarginSum += profitMargin;
      marginApplicableCount++;
    }
  });

  const avgMargin = marginApplicableCount > 0 ? (totalMarginSum / marginApplicableCount) : 0;

  return (
    <div className="po-container">
      {/* Header with action */}
      <div className="po-header">
        <div className="po-header-text">
          <h2>لوحة التحكم الشاملة للتسعير</h2>
          <p>نظرة عامة على حالة تسعير منتجاتك، وتطبيق الأسعار بضغطة زر.</p>
        </div>
        <button className="po-apply-all-btn flex-row align-center gap-2" onClick={handleApplyAll}>
          <SendIcon className="icon-sm" />
          تطبيق الأسعار المقترحة للكل
        </button>
      </div>

      {/* KPI Cards */}
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
            <span className="po-kpi-label">منتجات تحت التكلفة</span>
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
      </div>

      {/* Products Table */}
      <div className="po-table-card">
        <div className="po-table-header">
          <h3>
            <span className="po-table-icon flex-row align-center justify-center"><ClipboardIcon className="icon-sm" /></span>
            تفاصيل تسعير المنتجات
          </h3>
          <span className="po-table-count">{products.length} منتج</span>
        </div>
        <div className="po-table-wrap">
          <table className="po-table">
            <thead>
              <tr>
                <th className="po-th-product">المنتج</th>
                <th>سعر المورد</th>
                <th>إجمالي التكلفة</th>
                <th>السعر الحالي</th>
                <th className="po-th-suggested">السعر المقترح</th>
                <th>هامش الربح</th>
                <th>الحالة</th>
                <th className="po-th-action">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => {
                const baseC = getSupplierPrice(p);
                const { totalCost, suggestedPrice } = calculateCosts(baseC);
                const currP = currentPriceMock(p);
                const status = getStatus(currP, suggestedPrice, totalCost);
                const profitMargin = currP > 0 ? ((currP - totalCost) / currP) * 100 : 0;
                
                return (
                  <tr key={p.id} className="po-table-row">
                    <td className="po-td-product">
                      <div className="po-product-cell">
                        <span className="po-product-index">{idx + 1}</span>
                        <span className="po-product-name">{p.name}</span>
                      </div>
                    </td>
                    <td className="po-td-num">{fmtSAR(baseC)}</td>
                    <td className="po-td-num">{fmtSAR(totalCost)}</td>
                    <td className="po-td-num">{fmtSAR(currP)}</td>
                    <td className="po-td-num po-td-suggested">{fmtSAR(suggestedPrice)}</td>
                    <td className="po-td-num">
                      <span className={`po-margin-badge ${profitMargin > 0 ? 'positive' : 'negative'}`}>
                        {fmtPct(profitMargin)}%
                      </span>
                    </td>
                    <td>
                      <span className={`po-status-badge po-status-${status.type} flex-row align-center gap-1`}>
                        <span style={{ display: 'flex' }}>{status.icon}</span>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="po-update-btn" 
                        onClick={() => handleApplySingle(p.id, suggestedPrice)}
                        title="تحديث السعر المباشر"
                      >
                        تحديث
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PricingOverview;
