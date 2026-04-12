import { useState } from 'react';
import {
  MegaphoneIcon, TargetIcon, SwordsIcon, CompassIcon, PenToolIcon, GridIcon, AgencyIcon,
} from '../Icons';
import MarketingDashboard from './MarketingDashboard';
import TargetAudienceManager from './TargetAudienceManager';
import CompetitorsAnalysis from './CompetitorsAnalysis';
import SWOTAnalysis from './SWOTAnalysis';
import ContentStyleManager from './ContentStyleManager';
import MarketingAgency from './MarketingAgency';

const SUBTABS = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: GridIcon },
  { id: 'audience', label: 'الجمهور المستهدف', icon: TargetIcon },
  { id: 'competitors', label: 'تحليل المنافسين', icon: SwordsIcon },
  { id: 'swot', label: 'تحليل SWOT', icon: CompassIcon },
  { id: 'content-style', label: 'أسلوب المحتوى', icon: PenToolIcon },
  { id: 'agency', label: 'وكالة المحتوى', icon: AgencyIcon },
];

export default function MarketingHub({
  marketingData,
  setMarketingData,
  products,
  suppliers,
  costs,
  pricingData,
  finalPrices,
  exchangeRate,
  durations,
  coupons,
  bundles,
  appSettings,
  agencyData,
  setAgencyData,
}) {
  const [activeSubtab, setActiveSubtab] = useState('dashboard');

  const navigateToSubtab = (tabId) => setActiveSubtab(tabId);

  const updateMarketingData = (section, data) => {
    setMarketingData(prev => ({ ...prev, [section]: data }));
  };

  return (
    <div className="mkt-hub">
      <div className="mkt-hub-header">
        <div className="mkt-hub-title-wrap">
          <div className="mkt-hub-icon-wrap">
            <MegaphoneIcon />
          </div>
          <div>
            <h1 className="mkt-hub-title">مركز التسويق</h1>
            <p className="mkt-hub-subtitle">إدارة الاستراتيجية التسويقية وتحليل السوق</p>
          </div>
        </div>
      </div>

      <nav className="mkt-subtab-bar">
        {SUBTABS.map(tab => (
          <button
            key={tab.id}
            className={`mkt-subtab-btn ${activeSubtab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSubtab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="mkt-content">
        {activeSubtab === 'dashboard' && (
          <MarketingDashboard
            marketingData={marketingData}
            products={products}
            suppliers={suppliers}
            onNavigate={navigateToSubtab}
          />
        )}
        {activeSubtab === 'audience' && (
          <TargetAudienceManager
            segments={marketingData.targetAudience.segments}
            personas={marketingData.targetAudience.personas}
            onUpdate={(data) => updateMarketingData('targetAudience', data)}
          />
        )}
        {activeSubtab === 'competitors' && (
          <CompetitorsAnalysis
            marketingCompetitors={marketingData.competitors}
            products={products}
            onUpdate={(data) => updateMarketingData('competitors', data)}
          />
        )}
        {activeSubtab === 'swot' && (
          <SWOTAnalysis
            swotData={marketingData.swot}
            onUpdate={(data) => updateMarketingData('swot', data)}
            products={products}
            suppliers={suppliers}
            costs={costs}
            pricingData={pricingData}
            finalPrices={finalPrices}
            exchangeRate={exchangeRate}
            marketingData={marketingData}
          />
        )}
        {activeSubtab === 'content-style' && (
          <ContentStyleManager
            contentStyles={marketingData.contentStyles}
            competitors={[...marketingData.competitors.direct, ...marketingData.competitors.indirect]}
            onUpdate={(data) => updateMarketingData('contentStyles', data)}
          />
        )}
        {activeSubtab === 'agency' && (
          <MarketingAgency
            agencyData={agencyData}
            setAgencyData={setAgencyData}
            appSettings={appSettings}
            products={products}
            coupons={coupons}
            bundles={bundles}
            marketingData={marketingData}
            exchangeRate={exchangeRate}
            finalPrices={finalPrices}
            pricingData={pricingData}
          />
        )}
      </div>
    </div>
  );
}
