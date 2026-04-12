import { useState } from 'react';
import { GridIcon, InboxIcon, CheckCircleIcon } from '../Icons';
import AgencyDashboard from './AgencyDashboard';
import ApprovalInbox from './ApprovalInbox';
import ContentOutput from './ContentOutput';

const AGENCY_TABS = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: GridIcon },
  { id: 'inbox', label: 'صندوق الوارد', icon: InboxIcon },
  { id: 'output', label: 'المحتوى الجاهز', icon: CheckCircleIcon },
];

export default function MarketingAgency({
  agencyData,
  setAgencyData,
  appSettings,
  products,
  coupons,
  bundles,
  marketingData,
  exchangeRate,
  finalPrices,
  pricingData,
}) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const pendingCount = (agencyData.pipeline || []).filter(i => i.stage === 'approval' && i.status === 'pending').length;

  const updatePipeline = (newPipeline) => {
    setAgencyData(prev => ({ ...prev, pipeline: newPipeline }));
  };

  const appData = { products, coupons, bundles, marketingData, exchangeRate, finalPrices, pricingData };

  return (
    <div className="agency-wrap">
      <nav className="agency-tabs">
        {AGENCY_TABS.map(tab => (
          <button
            key={tab.id}
            className={`agency-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
            {tab.id === 'inbox' && pendingCount > 0 && (
              <span className="agency-tab-badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </nav>

      {activeTab === 'dashboard' && (
        <AgencyDashboard
          agencyData={agencyData}
          setAgencyData={setAgencyData}
          appSettings={appSettings}
          appData={appData}
        />
      )}
      {activeTab === 'inbox' && (
        <ApprovalInbox
          pipeline={agencyData.pipeline || []}
          updatePipeline={updatePipeline}
          agencyData={agencyData}
          setAgencyData={setAgencyData}
          appSettings={appSettings}
        />
      )}
      {activeTab === 'output' && (
        <ContentOutput
          pipeline={agencyData.pipeline || []}
          updatePipeline={updatePipeline}
        />
      )}
    </div>
  );
}
