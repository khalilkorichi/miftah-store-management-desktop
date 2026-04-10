import React, { useState } from 'react';
import { BarChartIcon, TrendingUpIcon, TrendingDownIcon, CheckCircleIcon, PackageIcon, EditIcon, ClipboardIcon, TrashIcon, DollarSignIcon, TagIcon, SparklesIcon } from '../Icons';
import AIBundleModal from './AIBundleModal';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function BundleOverview({ bundles, setBundles, products, getSupplierPrice, costs, setBundleToEdit, setActiveSubTab, appSettings, exchangeRate, onNavigateToSettings }) {
  const [expandedBundleId, setExpandedBundleId] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  
  const calculateBundleCosts = (b) => {
    let fixed = 0;
    let percents = 0;
    costs.filter(c => c.active).forEach(c => {
      if (c.type === 'fixed') fixed += c.value;
      else if (c.type === 'percentage') percents += c.value / 100;
    });
    const totalBaseCost = b.productIds.reduce((sum, pId) => {
      const p = products.find(prod => prod.id === pId);
      return sum + getSupplierPrice(p);
    }, 0);
    const price = b.sellingPrice || 0;
    const totalCost = totalBaseCost + fixed + (price * percents);
    const profit = price - totalCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { profit, margin, totalCost };
  };

  const totalBundles = bundles.length;
  let totalMarginSum = 0;
  let lossBundlesCount = 0;

  bundles.forEach(b => {
    const { profit, margin } = calculateBundleCosts(b);
    totalMarginSum += margin;
    if (profit < 0) lossBundlesCount++;
  });

  const avgMargin = totalBundles > 0 ? (totalMarginSum / totalBundles) : 0;

  const handleDeleteBundle = (id) => {
    if(window.confirm('هل أنت متأكد من حذف هذه الحزمة؟')) {
      setBundles(bundles.filter(b => b.id !== id));
    }
  };

  const handleEditBundle = (bundle) => {
    setBundleToEdit(bundle);
    setActiveSubTab('builder');
  };

  const handleDuplicateBundle = (bundle) => {
    const newBundle = {
      ...bundle,
      id: `bundle_${Date.now()}`,
      name: `${bundle.name} (نسخة)`,
      createdAt: new Date().toISOString()
    };
    setBundles([...bundles, newBundle]);
  };

  const toggleExpand = (id) => {
    setExpandedBundleId(prev => (prev === id ? null : id));
  };

  return (
    <div className="bo-container">
      <div className="po-kpi-grid">
        <div className="po-kpi-card po-kpi-blue">
          <div className="po-kpi-icon flex-row align-center justify-center"><BarChartIcon className="icon-lg" /></div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{totalBundles}</span>
            <span className="po-kpi-label">إجمالي الحزم</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
        <div className="po-kpi-card po-kpi-green">
          <div className="po-kpi-icon flex-row align-center justify-center"><TrendingUpIcon className="icon-lg" /></div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{fmtPct(avgMargin)}%</span>
            <span className="po-kpi-label">متوسط هامش الربح</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
        <div className={`po-kpi-card ${lossBundlesCount > 0 ? 'po-kpi-red' : 'po-kpi-green'}`}>
          <div className="po-kpi-icon flex-row align-center justify-center">{lossBundlesCount > 0 ? <TrendingDownIcon className="icon-lg" /> : <CheckCircleIcon className="icon-lg" />}</div>
          <div className="po-kpi-data">
            <span className="po-kpi-value">{lossBundlesCount}</span>
            <span className="po-kpi-label">حزم بخسارة</span>
          </div>
          <div className="po-kpi-glow" />
        </div>
        <button className="po-kpi-card po-kpi-purple po-kpi-clickable" onClick={() => setShowAIModal(true)} type="button">
          <div className="po-kpi-icon flex-row align-center justify-center"><SparklesIcon className="icon-lg" /></div>
          <div className="po-kpi-data">
            <span className="po-kpi-value po-kpi-value-sm">اقتراح ذكي</span>
            <span className="po-kpi-label">إنشاء حزم بالذكاء الاصطناعي</span>
          </div>
          <div className="po-kpi-glow" />
        </button>
      </div>

      <div className="bo-section-header">
        <div className="bo-section-title">
          <span className="bo-section-icon flex-row align-center justify-center"><PackageIcon className="icon-sm" /></span>
          <h3>قائمة الحزم الحالية</h3>
        </div>
        <span className="bo-section-count">{bundles.length} حزمة</span>
      </div>

      {bundles.length === 0 ? (
        <div className="bo-empty-state">
          <div className="bo-empty-icon-wrap">
            <PackageIcon className="icon-xl" />
          </div>
          <h4>لم تقم بإنشاء أي حزم بعد</h4>
          <p>انتقل إلى "تكوين الحزم" لإضافة حزمة جديدة</p>
          <button className="bo-empty-action" onClick={() => setActiveSubTab('builder')}>
            <PackageIcon className="icon-sm" /> إنشاء حزمة جديدة
          </button>
        </div>
      ) : (
        <div className="bo-cards-grid">
          {bundles.map((b, idx) => {
            const { profit, margin } = calculateBundleCosts(b);
            const isExpanded = expandedBundleId === b.id;
            return (
              <div key={b.id} className={`bo-bundle-card ${isExpanded ? 'bo-card-expanded' : ''}`}>
                <div className="bo-card-top">
                  <div className="bo-card-index">{idx + 1}</div>
                  <div className="bo-card-info">
                    <h4 className="bo-card-name">{b.name}</h4>
                    <button className="bo-card-products-btn" onClick={() => toggleExpand(b.id)}>
                      <PackageIcon className="icon-xs" />
                      {b.productIds.length} منتجات
                      <span className="bo-chevron">{isExpanded ? '▲' : '▼'}</span>
                    </button>
                  </div>
                  <div className="bo-card-actions">
                    <button className="bo-action-btn bo-action-edit" title="تعديل" onClick={() => handleEditBundle(b)}><EditIcon className="icon-sm" /></button>
                    <button className="bo-action-btn bo-action-copy" title="تكرار" onClick={() => handleDuplicateBundle(b)}><ClipboardIcon className="icon-sm" /></button>
                    <button className="bo-action-btn bo-action-delete" title="حذف" onClick={() => handleDeleteBundle(b.id)}><TrashIcon className="icon-sm" /></button>
                  </div>
                </div>

                <div className="bo-card-stats">
                  <div className="bo-stat-item">
                    <span className="bo-stat-icon"><DollarSignIcon className="icon-xs" /></span>
                    <div className="bo-stat-content">
                      <span className="bo-stat-label">سعر البيع</span>
                      {b.sellingPrice ? (
                        <span className="bo-stat-value">{fmt(b.sellingPrice)} ر.س</span>
                      ) : (
                        <span className="bo-stat-value bo-stat-unpriced">غير مسعرة</span>
                      )}
                    </div>
                  </div>
                  <div className="bo-stat-divider" />
                  <div className="bo-stat-item">
                    <span className="bo-stat-icon"><TrendingUpIcon className="icon-xs" /></span>
                    <div className="bo-stat-content">
                      <span className="bo-stat-label">الربح</span>
                      {b.sellingPrice ? (
                        <span className={`bo-stat-value ${profit > 0 ? 'bo-stat-positive' : 'bo-stat-negative'}`}>
                          {profit > 0 ? '+' : ''}{fmt(profit)} ر.س
                        </span>
                      ) : (
                        <span className="bo-stat-value bo-stat-unpriced">—</span>
                      )}
                    </div>
                  </div>
                  <div className="bo-stat-divider" />
                  <div className="bo-stat-item">
                    <span className="bo-stat-icon"><TagIcon className="icon-xs" /></span>
                    <div className="bo-stat-content">
                      <span className="bo-stat-label">الهامش</span>
                      {b.sellingPrice ? (
                        <span className={`bo-stat-value ${margin > 0 ? 'bo-stat-positive' : 'bo-stat-negative'}`}>
                          {fmtPct(margin)}%
                        </span>
                      ) : (
                        <span className="bo-stat-value bo-stat-unpriced">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bo-card-expanded-content">
                    <div className="bo-expanded-label">
                      <PackageIcon className="icon-xs" /> المنتجات في هذه الحزمة:
                    </div>
                    <div className="bo-expanded-chips">
                      {b.productIds.map((pId, i) => {
                        const p = products.find(prod => prod.id === pId);
                        return (
                          <span key={`${pId}-${i}`} className="po-product-chip">
                            <span className="po-chip-dot"></span>
                            {p ? p.name : 'منتج محذوف'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAIModal && (
        <AIBundleModal
          products={products}
          getSupplierPrice={getSupplierPrice}
          costs={costs}
          exchangeRate={exchangeRate}
          bundles={bundles}
          setBundles={setBundles}
          appSettings={appSettings}
          onClose={() => setShowAIModal(false)}
          onNavigateToSettings={onNavigateToSettings}
        />
      )}
    </div>
  );
}

export default BundleOverview;
