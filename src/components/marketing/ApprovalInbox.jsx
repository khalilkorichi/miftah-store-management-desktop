import { useState } from 'react';
import { AGENT_META, CONTENT_TYPES } from '../../data/contentAgencyData';
import { runProduction, runQA } from '../../utils/pipelineManager';
import { CheckIcon, XIcon, EditIcon, RefreshIcon } from '../Icons';

export default function ApprovalInbox({ pipeline, updatePipeline, agencyData, setAgencyData, appSettings }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [processing, setProcessing] = useState({});

  const pendingItems = pipeline.filter(i => i.stage === 'approval' && i.status === 'pending');
  const productionItems = pipeline.filter(i => i.stage === 'production' || i.stage === 'qa');

  const approve = async (item) => {
    setProcessing(p => ({ ...p, [item.id]: 'producing' }));
    const updated = pipeline.map(i => i.id === item.id ? { ...i, status: 'approved_idea' } : i);
    updatePipeline(updated);

    try {
      const produced = await runProduction(item, agencyData, appSettings);
      const qa = await runQA(produced, agencyData, appSettings);

      if (qa.status === 'retry') {
        const retryProduced = await runProduction(qa, agencyData, appSettings);
        const retryQA = await runQA(retryProduced, agencyData, appSettings);
        setAgencyData(prev => ({
          ...prev,
          pipeline: prev.pipeline.map(i => i.id === item.id ? retryQA : i),
        }));
      } else {
        setAgencyData(prev => ({
          ...prev,
          pipeline: prev.pipeline.map(i => i.id === item.id ? qa : i),
        }));
      }
    } catch (e) {
      setAgencyData(prev => ({
        ...prev,
        pipeline: prev.pipeline.map(i => i.id === item.id ? { ...i, stage: 'done', status: 'error', error: e.message } : i),
      }));
    } finally {
      setProcessing(p => { const n = { ...p }; delete n[item.id]; return n; });
    }
  };

  const reject = (item) => {
    const updated = pipeline.map(i => i.id === item.id ? { ...i, status: 'rejected', stage: 'rejected' } : i);
    updatePipeline(updated);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.content?.summary || '');
  };

  const saveEdit = (item) => {
    const updated = pipeline.map(i =>
      i.id === item.id ? { ...i, content: { ...i.content, summary: editText } } : i
    );
    updatePipeline(updated);
    setEditingId(null);
  };

  const getContentTypeLabel = (type) => CONTENT_TYPES.find(t => t.id === type)?.label || type;
  const getContentTypeIcon = (type) => CONTENT_TYPES.find(t => t.id === type)?.icon || '📝';

  return (
    <div className="agency-inbox">
      {pendingItems.length === 0 && productionItems.length === 0 ? (
        <div className="mkt-empty">لا توجد أفكار بانتظار المراجعة. اضغط "توليد دورة جديدة" في لوحة التحكم.</div>
      ) : (
        <>
          {pendingItems.length > 0 && (
            <div className="inbox-section">
              <h3 className="agency-section-title">أفكار بانتظار المراجعة ({pendingItems.length})</h3>
              <div className="inbox-cards-grid">
                {pendingItems.map(item => {
                  const meta = AGENT_META[item.agentId] || {};
                  const isProcessing = processing[item.id];

                  return (
                    <div key={item.id} className="inbox-card" style={{ '--agent-color': meta.color }}>
                      <div className="inbox-card-header">
                        <div className="inbox-card-agent">
                          <span className="inbox-agent-icon">{meta.icon}</span>
                          <span className="inbox-agent-name">{meta.name}</span>
                        </div>
                        <div className="inbox-card-type">
                          <span>{getContentTypeIcon(item.contentType)}</span>
                          <span>{getContentTypeLabel(item.contentType)}</span>
                        </div>
                      </div>

                      <h4 className="inbox-card-title">{item.content?.title || 'فكرة'}</h4>

                      {item.content?.product && (
                        <div className="inbox-card-product">المنتج: {item.content.product}</div>
                      )}

                      {editingId === item.id ? (
                        <div className="inbox-card-edit">
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            rows={3}
                          />
                          <div className="inbox-card-edit-actions">
                            <button className="mkt-btn-primary" onClick={() => saveEdit(item)}>حفظ</button>
                            <button className="mkt-btn-secondary" onClick={() => setEditingId(null)}>إلغاء</button>
                          </div>
                        </div>
                      ) : (
                        <p className="inbox-card-summary">{item.content?.summary || ''}</p>
                      )}

                      <div className="inbox-card-actions">
                        {isProcessing ? (
                          <div className="inbox-processing">
                            <RefreshIcon className="spinning" />
                            <span>قيد الإنتاج...</span>
                          </div>
                        ) : (
                          <>
                            <button className="inbox-btn inbox-btn-approve" onClick={() => approve(item)} title="موافقة">
                              <CheckIcon /> <span>موافقة</span>
                            </button>
                            <button className="inbox-btn inbox-btn-reject" onClick={() => reject(item)} title="رفض">
                              <XIcon /> <span>رفض</span>
                            </button>
                            <button className="inbox-btn inbox-btn-edit" onClick={() => startEdit(item)} title="تعديل">
                              <EditIcon />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {productionItems.length > 0 && (
            <div className="inbox-section">
              <h3 className="agency-section-title">قيد الإنتاج ({productionItems.length})</h3>
              <div className="inbox-production-list">
                {productionItems.map(item => (
                  <div key={item.id} className="inbox-production-item">
                    <RefreshIcon className="spinning" />
                    <span>{item.content?.title || 'فكرة'}</span>
                    <span className="inbox-production-stage">
                      {item.stage === 'production' ? 'إنتاج المحتوى' : 'فحص الجودة'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
