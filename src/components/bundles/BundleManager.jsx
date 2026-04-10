import React, { useState } from 'react';
import { BarChartIcon, PackageIcon, TagIcon } from '../Icons';
import BundleOverview from './BundleOverview';
import BundleBuilder from './BundleBuilder';
import BundlePricing from './BundlePricing';

function BundleManager({ bundles, setBundles, products, suppliers, exchangeRate, pricingData, costs, appSettings, onNavigateToSettings }) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [bundleToEdit, setBundleToEdit] = useState(null);

  const getSupplierPrice = (prod) => {
    if (!prod || !prod.plans || prod.plans.length === 0) return 0;
    const plan = prod.plans[0];
    const savedConfig = pricingData[prod.id] || {};
    const supplierId = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices[supplierId] || 0) * exchangeRate;
  };

  const tabs = [
    { id: 'overview', icon: <BarChartIcon className="icon-sm" />, label: 'نظرة عامة', desc: 'إحصائيات الحزم' },
    { id: 'builder', icon: <PackageIcon className="icon-sm" />, label: 'تكوين الحزم', desc: 'إنشاء حزم جديدة' },
    { id: 'pricing', icon: <TagIcon className="icon-sm" />, label: 'إدارة الأسعار', desc: 'تسعير الحزم' },
  ];

  return (
    <div className="pricing-dashboard-v2">
      {/* Page Header */}
      <div className="pd-page-header">
        <div className="pd-header-content">
          <div className="pd-header-icon-wrap pd-header-icon-bundles flex-row align-center justify-center">
            <PackageIcon className="icon-xl" />
          </div>
          <div>
            <h1 className="pd-page-title">الحزم والمجموعات</h1>
            <p className="pd-page-subtitle">نظام متكامل لإنشاء، إدارة، وتسعير الحزم لزيادة المبيعات والعروض</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="pd-nav-bar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`pd-nav-tab ${activeSubTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab.id)}
          >
            <span className="pd-nav-icon flex-row align-center justify-center">{tab.icon}</span>
            <div className="pd-nav-text">
              <span className="pd-nav-label">{tab.label}</span>
              <span className="pd-nav-desc">{tab.desc}</span>
            </div>
            {activeSubTab === tab.id && <div className="pd-nav-indicator" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pd-content-area">
        {activeSubTab === 'overview' && (
          <BundleOverview 
            bundles={bundles}
            setBundles={setBundles}
            products={products}
            getSupplierPrice={getSupplierPrice}
            costs={costs}
            setBundleToEdit={setBundleToEdit}
            setActiveSubTab={setActiveSubTab}
            appSettings={appSettings}
            exchangeRate={exchangeRate}
            onNavigateToSettings={onNavigateToSettings}
          />
        )}
        {activeSubTab === 'builder' && (
          <BundleBuilder 
            bundles={bundles}
            setBundles={setBundles}
            products={products}
            getSupplierPrice={getSupplierPrice}
            setActiveSubTab={setActiveSubTab}
            bundleToEdit={bundleToEdit}
            setBundleToEdit={setBundleToEdit}
          />
        )}
        {activeSubTab === 'pricing' && (
          <BundlePricing 
            bundles={bundles}
            setBundles={setBundles}
            products={products}
            getSupplierPrice={getSupplierPrice}
            costs={costs}
          />
        )}
      </div>
    </div>
  );
}

export default BundleManager;
