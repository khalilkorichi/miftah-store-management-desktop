import { useState } from 'react';
import { AGENT_META, PIPELINE_STAGES } from '../../data/contentAgencyData';
import { runIdeation } from '../../utils/pipelineManager';
import { SparklesIcon, RefreshIcon } from '../Icons';
import AgencyChat from './AgencyChat';

const STAGE_LABELS = {
  ideation: 'توليد الأفكار',
  approval: 'انتظار الموافقة',
  production: 'الإنتاج',
  qa: 'فحص الجودة',
  done: 'جاهز',
  rejected: 'مرفوض',
};

export default function AgencyDashboard({ agencyData, setAgencyData, appSettings, appData }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const pipeline = agencyData.pipeline || [];

  const stats = {
    totalIdeas: pipeline.filter(i => i.stage === 'approval').length,
    approved: pipeline.filter(i => i.status === 'approved' || i.status === 'approved_with_issues').length,
    pending: pipeline.filter(i => i.stage === 'approval' && i.status === 'pending').length,
    ready: pipeline.filter(i => i.stage === 'done').length,
    rejected: pipeline.filter(i => i.status === 'rejected').length,
    errors: pipeline.filter(i => i.status === 'error').length,
  };

  const lensPassRate = stats.approved + stats.rejected > 0
    ? Math.round((stats.approved / (stats.approved + stats.rejected)) * 100)
    : 0;

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const newItems = await runIdeation(agencyData, appSettings, appData);
      setAgencyData(prev => ({
        ...prev,
        pipeline: [...(prev.pipeline || []), ...newItems],
      }));
    } catch (e) {
      setError(e.message || 'حدث خطأ أثناء التوليد');
    } finally {
      setGenerating(false);
    }
  };

  const agents = ['scott', 'spark', 'brill', 'rami', 'lens', 'buffy'];

  return (
    <div className="agency-dashboard-split">
      <div className="agency-dashboard-panel">
        <div className="agency-stats-row">
          <div className="agency-stat-card">
            <span className="agency-stat-value">{stats.totalIdeas}</span>
            <span className="agency-stat-label">أفكار مولَّدة</span>
          </div>
          <div className="agency-stat-card">
            <span className="agency-stat-value">{stats.pending}</span>
            <span className="agency-stat-label">بانتظار الموافقة</span>
          </div>
          <div className="agency-stat-card">
            <span className="agency-stat-value">{stats.ready}</span>
            <span className="agency-stat-label">محتوى جاهز</span>
          </div>
          <div className="agency-stat-card">
            <span className="agency-stat-value">{lensPassRate}%</span>
            <span className="agency-stat-label">معدل اجتياز Lens</span>
          </div>
        </div>

        <div className="agency-generate-section">
          <button
            className="agency-generate-btn"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? <RefreshIcon className="spinning" /> : <SparklesIcon />}
            <span>{generating ? 'جاري التوليد...' : 'توليد دورة جديدة'}</span>
          </button>
          {error && <div className="agency-error">{error}</div>}
        </div>

        <div className="agency-pipeline-visual">
          <h3 className="agency-section-title">خط الإنتاج (Pipeline)</h3>
          <div className="pipeline-stages">
            {PIPELINE_STAGES.filter(s => s !== 'rejected').map((stage, idx) => {
              const count = pipeline.filter(i => i.stage === stage).length;
              const isActive = count > 0;
              return (
                <div key={stage} className={`pipeline-stage ${isActive ? 'active' : ''}`}>
                  <div className="pipeline-stage-dot" />
                  {idx < 4 && <div className="pipeline-stage-line" />}
                  <span className="pipeline-stage-label">{STAGE_LABELS[stage]}</span>
                  <span className="pipeline-stage-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="agency-agents-grid">
          <h3 className="agency-section-title">حالة الوكلاء</h3>
          <div className="agents-grid">
            {agents.map(id => {
              const meta = AGENT_META[id];
              const config = agencyData.agents?.[id];
              const isComingSoon = meta.comingSoon;
              const isEnabled = !isComingSoon && config?.enabled;
              const activeItems = pipeline.filter(i =>
                (i.agentId === id || i.producedBy === id) && i.stage !== 'done' && i.stage !== 'rejected'
              ).length;

              let status = 'منتهٍ';
              let statusClass = 'idle';
              if (isComingSoon) { status = 'قريباً'; statusClass = 'coming-soon'; }
              else if (!isEnabled) { status = 'معطّل'; statusClass = 'disabled'; }
              else if (generating && (id === 'scott' || id === 'spark')) { status = 'نشط'; statusClass = 'active'; }
              else if (activeItems > 0) { status = 'يعمل'; statusClass = 'active'; }

              return (
                <div key={id} className={`agent-card agent-card-${statusClass}`} style={{ '--agent-color': meta.color }}>
                  <div className="agent-card-icon">{meta.icon}</div>
                  <div className="agent-card-info">
                    <span className="agent-card-name">{meta.name}</span>
                    <span className="agent-card-role">{meta.role}</span>
                  </div>
                  <span className={`agent-status-badge status-${statusClass}`}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="agency-chat-panel">
        <AgencyChat
          agencyData={agencyData}
          setAgencyData={setAgencyData}
          appSettings={appSettings}
          appData={appData}
        />
      </div>
    </div>
  );
}
