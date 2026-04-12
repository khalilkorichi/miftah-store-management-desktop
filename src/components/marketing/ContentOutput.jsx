import { useState } from 'react';
import { AGENT_META, CONTENT_TYPES } from '../../data/contentAgencyData';
import { CopyIcon, TrashIcon, CheckCircleIcon, AlertTriangleIcon } from '../Icons';

export default function ContentOutput({ pipeline, updatePipeline }) {
  const [activeView, setActiveView] = useState('approved');
  const [copiedId, setCopiedId] = useState(null);

  const approvedItems = pipeline.filter(i => i.stage === 'done' && (i.status === 'approved' || i.status === 'approved_with_issues'));
  const rejectedItems = pipeline.filter(i => i.status === 'rejected');
  const errorItems = pipeline.filter(i => i.status === 'error');

  const copyContent = (item) => {
    let text = '';
    const pc = item.producedContent;
    if (!pc) { text = item.content?.summary || ''; }
    else if (pc.text) { text = pc.text; }
    else if (pc.hook && pc.slides) {
      text = `${pc.hook}\n\n${pc.slides.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n${pc.cta || ''}`;
      if (pc.hashtags) text += `\n\n${pc.hashtags.map(h => `#${h}`).join(' ')}`;
    } else if (pc.hook && pc.body) {
      text = `🎬 Hook:\n${pc.hook}\n\n📝 Body:\n${pc.body}\n\n📣 CTA:\n${pc.cta || ''}`;
    } else {
      text = JSON.stringify(pc, null, 2);
    }

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const archive = (id) => {
    updatePipeline(pipeline.filter(i => i.id !== id));
  };

  const getContentTypeLabel = (type) => CONTENT_TYPES.find(t => t.id === type)?.label || type;

  const renderContent = (item) => {
    const pc = item.producedContent;
    if (!pc) return <p className="output-text">{item.content?.summary || 'لا يوجد محتوى'}</p>;

    if (pc.text) {
      return <pre className="output-text">{pc.text}</pre>;
    }

    if (pc.hook && pc.slides) {
      return (
        <div className="output-carousel">
          <div className="output-carousel-hook">{pc.hook}</div>
          <div className="output-carousel-slides">
            {pc.slides.map((s, i) => (
              <div key={i} className="output-carousel-slide">
                <span className="output-slide-num">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
          {pc.cta && <div className="output-carousel-cta">{pc.cta}</div>}
          {pc.hashtags && <div className="output-hashtags">{pc.hashtags.map(h => `#${h}`).join(' ')}</div>}
        </div>
      );
    }

    if (pc.hook && pc.body) {
      return (
        <div className="output-script">
          <div className="output-script-section">
            <span className="output-script-label">Hook</span>
            <p>{pc.hook}</p>
          </div>
          <div className="output-script-section">
            <span className="output-script-label">Body</span>
            <p>{pc.body}</p>
          </div>
          <div className="output-script-section">
            <span className="output-script-label">CTA</span>
            <p>{pc.cta}</p>
          </div>
          {pc.duration && <div className="output-script-duration">المدة: {pc.duration}</div>}
        </div>
      );
    }

    return <pre className="output-text">{JSON.stringify(pc, null, 2)}</pre>;
  };

  const currentItems = activeView === 'approved' ? approvedItems
    : activeView === 'rejected' ? rejectedItems
    : errorItems;

  return (
    <div className="agency-output">
      <div className="output-tabs">
        <button className={`output-tab ${activeView === 'approved' ? 'active' : ''}`} onClick={() => setActiveView('approved')}>
          <CheckCircleIcon /> المحتوى الجاهز ({approvedItems.length})
        </button>
        <button className={`output-tab ${activeView === 'rejected' ? 'active' : ''}`} onClick={() => setActiveView('rejected')}>
          <AlertTriangleIcon /> مرفوض ({rejectedItems.length})
        </button>
      </div>

      {currentItems.length === 0 ? (
        <div className="mkt-empty">
          {activeView === 'approved' ? 'لا يوجد محتوى جاهز بعد' : 'لا يوجد محتوى مرفوض'}
        </div>
      ) : (
        <div className="output-list">
          {currentItems.map(item => {
            const meta = AGENT_META[item.producedBy || item.agentId] || {};
            const qaScore = item.qaResult?.score;

            return (
              <div key={item.id} className="output-card">
                <div className="output-card-header">
                  <div className="output-card-meta">
                    <span className="output-agent-badge" style={{ background: `${meta.color}22`, color: meta.color }}>
                      {meta.icon} {meta.name}
                    </span>
                    <span className="output-type-badge">{getContentTypeLabel(item.contentType)}</span>
                    {qaScore != null && (
                      <span className={`output-score-badge ${qaScore >= 80 ? 'high' : qaScore >= 50 ? 'mid' : 'low'}`}>
                        {qaScore}%
                      </span>
                    )}
                  </div>
                  <div className="output-card-actions">
                    <button onClick={() => copyContent(item)} className="output-action-btn" title="نسخ">
                      <CopyIcon />
                      {copiedId === item.id && <span className="output-copied">تم النسخ</span>}
                    </button>
                    <button onClick={() => archive(item.id)} className="output-action-btn" title="أرشفة">
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <h4 className="output-card-title">{item.content?.title || 'محتوى'}</h4>
                {item.content?.product && <div className="output-card-product">المنتج: {item.content.product}</div>}

                <div className="output-card-body">
                  {activeView === 'approved' ? renderContent(item) : (
                    <div className="output-rejection">
                      <p className="output-text">{item.content?.summary || ''}</p>
                      {item.qaResult?.issues?.length > 0 && (
                        <div className="output-issues">
                          <strong>مشاكل:</strong>
                          <ul>{item.qaResult.issues.map((iss, i) => <li key={i}>{iss}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {item.status === 'approved_with_issues' && item.qaResult?.suggestions?.length > 0 && (
                  <div className="output-suggestions">
                    <strong>ملاحظات Lens:</strong>
                    <ul>{item.qaResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}

                <div className="output-card-footer">
                  <span>{new Date(item.producedAt || item.createdAt).toLocaleDateString('ar-SA-u-nu-latn')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
