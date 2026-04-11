import React, { useState } from 'react';
import { PackageIcon, ZapIcon, TargetIcon, TagIcon, PlusIcon } from '../Icons';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function BundlePricing({ bundles, setBundles, products, getSupplierPrice, costs, setActiveSubTab }) {
  const [selectedBundleId, setSelectedBundleId] = useState(bundles.length > 0 ? bundles[0].id : null);
  const [discountPercent, setDiscountPercent] = useState(10);
  
  const calculateBundleCosts = (b, hypotheticalPrice = null) => {
    let fixed = 0;
    let percents = 0;
    costs.filter(c => c.active).forEach(c => {
      if (c.type === 'fixed') fixed += c.value;
      else if (c.type === 'percentage') percents += c.value / 100;
    });
    const sumProductsBase = b.productIds.reduce((sum, pId) => {
      const p = products.find(prod => prod.id === pId);
      return sum + getSupplierPrice(p);
    }, 0);
    const price = hypotheticalPrice !== null ? hypotheticalPrice : (b.sellingPrice || 0);
    const totalCost = sumProductsBase + fixed + (price * percents);
    const profit = price - totalCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { sumProductsBase, profit, margin, totalCost };
  };

  if (bundles.length === 0) {
    return (
      <div className="bp-empty-state">
        <div className="bp-empty-icon-wrap flex-row align-center justify-center">
          <TagIcon className="icon-xl" />
        </div>
        <h4>لا توجد حزم لتسعيرها</h4>
        <p>قم بإنشاء حزمة جديدة أولاً من تبويب "تكوين الحزم" ثم عُد هنا لتحديد أسعارها وحساب هوامش الربح</p>
        {setActiveSubTab && (
          <button className="bp-empty-action" onClick={() => setActiveSubTab('builder')}>
            <PlusIcon className="icon-sm" />
            إنشاء حزمة جديدة
          </button>
        )}
      </div>
    );
  }

  const selectedBundle = bundles.find(b => b.id === selectedBundleId) || bundles[0];
  const bundleStats = calculateBundleCosts(selectedBundle);

  const handlePriceChange = (val) => {
    const newPrice = parseFloat(val) || 0;
    setBundles(bundles.map(b => b.id === selectedBundle.id ? {...b, sellingPrice: newPrice} : b));
  };

  const applyMarkupOnBase = () => {
    const sumBase = bundleStats.totalCost;
    const proposed = sumBase * (1 + (discountPercent/100));
    handlePriceChange(fmt(proposed));
  };

  return (
    <div className="bp-container">
      {/* Bundle Sidebar */}
      <div className="bp-sidebar">
        <div className="bp-sidebar-header">
          <span className="flex-row align-center justify-center"><PackageIcon className="icon-sm" /></span>
          <h4>الحزم المتاحة</h4>
        </div>
        <div className="bp-sidebar-list">
          {bundles.map(b => {
            const stats = calculateBundleCosts(b);
            return (
              <div 
                key={b.id} 
                className={`bp-sidebar-item ${b.id === selectedBundleId ? 'bp-sidebar-active' : ''}`}
                onClick={() => setSelectedBundleId(b.id)}
              >
                <div className="bp-sidebar-name">{b.name}</div>
                <div className="bp-sidebar-meta">
                  <span>{b.productIds.length} منتجات</span>
                  <span className={stats.profit > 0 ? 'text-success' : 'text-danger'}>
                    {b.sellingPrice ? `${fmt(stats.profit)} ر.س` : 'غير مسعر'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Details */}
      <div className="bp-details">
        {/* Bundle Header */}
        <div className="bp-details-header">
          <div className="bp-bundle-title">
            <h3>{selectedBundle.name}</h3>
            <span>{selectedBundle.productIds.length} منتجات في الحزمة</span>
          </div>
        </div>

        {/* Cost Boxes */}
        <div className="bp-cost-grid">
          <div className="bp-cost-box">
            <span className="bp-cost-label">تكلفة الموردين الأصلية</span>
            <span className="bp-cost-value">{fmt(bundleStats.sumProductsBase)} <small>ر.س</small></span>
          </div>
          <div className="bp-cost-box bp-cost-total">
            <span className="bp-cost-label">إجمالي التكاليف (شامل العمولة)</span>
            <span className="bp-cost-value bp-cost-red">{fmt(bundleStats.totalCost)} <small>ر.س</small></span>
          </div>
        </div>

        {/* Price Input */}
        <div className="bp-price-input-section">
          <label>سعر بيع الحزمة النهائي للعميل (ر.س)</label>
          <input 
            type="number" 
            className="bp-price-input"
            value={selectedBundle.sellingPrice || ''}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder="أدخل السعر هنا..."
          />
        </div>

        {/* Result KPIs */}
        <div className="bp-result-grid">
          <div className="bp-result-card">
            <span className="bp-result-label">الربح الصافي</span>
            <span className={`bp-result-value ${bundleStats.profit > 0 ? 'text-success' : 'text-danger'}`}>
              {bundleStats.profit > 0 ? '+' : ''}{fmt(bundleStats.profit)} ر.س
            </span>
          </div>
          <div className="bp-result-card">
            <span className="bp-result-label">هامش الربح</span>
            <span className="bp-result-value">{fmtPct(bundleStats.margin)}%</span>
          </div>
        </div>

        {/* Quick Markup */}
        <div className="bp-markup-section">
          <div className="bp-markup-header">
            <span className="flex-row align-center justify-center"><ZapIcon className="icon-sm" /></span>
            <div>
              <h4>تسعير سريع بالحزمة المجمعة</h4>
              <p>حدد نسبة الربح المرغوبة فوق إجمالي التكاليف</p>
            </div>
          </div>
          <div className="bp-markup-row">
            <div className="cpn-field" style={{flex: 1}}>
              <label>نسبة ربح مرغوبة (%)</label>
              <input type="number" value={discountPercent} onChange={e=>setDiscountPercent(e.target.value)} />
            </div>
            <button className="pm-add-comp-btn flex-row align-center gap-2" onClick={applyMarkupOnBase} style={{alignSelf: 'flex-end'}}>
              <TargetIcon className="icon-sm" /> تطبيق السعر المقترح
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BundlePricing;
