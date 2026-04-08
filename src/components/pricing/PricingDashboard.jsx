import React, { useState } from 'react';
import { BarChartIcon, DollarSignIcon, SettingsIcon, TagIcon, CheckCircleIcon } from '../Icons';
import CostManager from './CostManager';
import PricingMechanisms from './PricingMechanisms';
import CouponsManager from './CouponsManager';
import PricingOverview from './PricingOverview';
import FinalPricesManager from './FinalPricesManager';

function PricingDashboard({
  products,
  suppliers,
  durations,
  exchangeRate,
  costs,
  setCosts,
  pricingData,
  setPricingData,
  coupons,
  setCoupons,
  finalPrices,
  onSetFinalPrices,
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const tabs = [
    { id: 'overview', icon: <BarChartIcon className="icon-sm" />, label: 'نظرة عامة', desc: 'ملخص شامل للتسعير' },
    { id: 'costs', icon: <DollarSignIcon className="icon-sm" />, label: 'إدارة التكاليف', desc: 'التكاليف الثابتة والمتغيرة' },
    { id: 'mechanisms', icon: <SettingsIcon className="icon-sm" />, label: 'آليات التسعير', desc: 'محرك التسعير الذكي' },
    { id: 'coupons', icon: <TagIcon className="icon-sm" />, label: 'الكوبونات', desc: 'إدارة الخصومات' },
    { id: 'finalprices', icon: <CheckCircleIcon className="icon-sm" />, label: 'الأسعار النهائية', desc: 'الأسعار المعتمدة للمنتجات' },
  ];

  return (
    <div className="pricing-dashboard-v2">
      <div className="pd-page-header">
        <div className="pd-header-content">
          <div className="pd-header-icon-wrap pd-header-icon-pricing flex-row align-center justify-center">
            <DollarSignIcon className="icon-xl" />
          </div>
          <div>
            <h1 className="pd-page-title">مركز إدارة التسعير</h1>
            <p className="pd-page-subtitle">تحكم كامل بالتكاليف، آليات التسعير، والكوبونات لتحقيق أقصى ربحية</p>
          </div>
        </div>
      </div>

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

      <div className="pd-content-area">
        {activeSubTab === 'overview' && (
          <PricingOverview
            products={products}
            suppliers={suppliers}
            costs={costs}
            exchangeRate={exchangeRate}
            pricingData={pricingData}
            finalPrices={finalPrices}
            onGoToFinalPrices={() => setActiveSubTab('finalprices')}
          />
        )}
        {activeSubTab === 'costs' && (
          <CostManager costs={costs} setCosts={setCosts} />
        )}
        {activeSubTab === 'mechanisms' && (
          <PricingMechanisms
            products={products}
            suppliers={suppliers}
            costs={costs}
            exchangeRate={exchangeRate}
            pricingData={pricingData}
            setPricingData={setPricingData}
          />
        )}
        {activeSubTab === 'coupons' && (
          <CouponsManager
            coupons={coupons}
            setCoupons={setCoupons}
            products={products}
            suppliers={suppliers}
            costs={costs}
            exchangeRate={exchangeRate}
            pricingData={pricingData}
          />
        )}
        {activeSubTab === 'finalprices' && (
          <FinalPricesManager
            products={products}
            suppliers={suppliers}
            durations={durations}
            costs={costs}
            pricingData={pricingData}
            exchangeRate={exchangeRate}
            finalPrices={finalPrices}
            onSetFinalPrices={onSetFinalPrices}
          />
        )}
      </div>
    </div>
  );
}

export default PricingDashboard;
