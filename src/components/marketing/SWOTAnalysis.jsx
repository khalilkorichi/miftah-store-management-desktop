import { useState, useMemo } from 'react';
import { PlusIcon, TrashIcon, EditIcon, CheckIcon, XIcon, SparklesIcon, CopyIcon, CompassIcon } from '../Icons';

const QUADRANTS = [
  { key: 'strengths', label: 'نقاط القوة', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.08)', icon: '💪' },
  { key: 'weaknesses', label: 'نقاط الضعف', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.08)', icon: '⚠️' },
  { key: 'opportunities', label: 'الفرص', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.08)', icon: '🚀' },
  { key: 'threats', label: 'التهديدات', color: '#F97316', bgColor: 'rgba(249, 115, 22, 0.08)', icon: '🔥' },
];

export default function SWOTAnalysis({
  swotData, onUpdate, products, suppliers, costs, pricingData, finalPrices, exchangeRate, marketingData,
}) {
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');
  const [newTexts, setNewTexts] = useState({ strengths: '', weaknesses: '', opportunities: '', threats: '' });
  const [dismissedSuggestions, setDismissedSuggestions] = useState([]);

  const suggestions = useMemo(() => {
    const s = { strengths: [], weaknesses: [], opportunities: [], threats: [] };
    if (!products) return s;

    const totalProducts = products.length;
    const totalSuppliers = (suppliers || []).length;

    if (totalProducts >= 5) s.strengths.push({ id: 'auto_products', text: `تنوع المنتجات: ${totalProducts} منتج في المتجر`, auto: true });
    if (totalSuppliers >= 3) s.strengths.push({ id: 'auto_suppliers', text: `تعدد الموردين: ${totalSuppliers} مورد يضمن استمرارية التوريد`, auto: true });

    if (pricingData) {
      const pricedCount = Object.keys(pricingData).length;
      const unpricedCount = totalProducts - pricedCount;
      if (unpricedCount > 0 && totalProducts > 0) {
        s.weaknesses.push({ id: 'auto_unpriced', text: `${unpricedCount} منتج بدون تسعير نهائي`, auto: true });
      }

      let goodMarginCount = 0;
      Object.entries(pricingData).forEach(([prodId, pd]) => {
        if (pd.margin && pd.margin >= 20) goodMarginCount++;
      });
      if (goodMarginCount > 0) {
        s.strengths.push({ id: 'auto_margins', text: `${goodMarginCount} منتج بهامش ربح جيد (≥20%)`, auto: true });
      }
    }

    const singleSupplierProducts = products.filter(p => {
      const planPrices = (p.plans || []).map(pl => Object.keys(pl.prices || {}).length);
      return planPrices.length > 0 && planPrices.every(c => c <= 1);
    });
    if (singleSupplierProducts.length > 0) {
      s.weaknesses.push({ id: 'auto_single_supplier', text: `${singleSupplierProducts.length} منتج يعتمد على مورد وحيد`, auto: true });
    }

    const competitorsWithLowerPrices = [];
    products.forEach(prod => {
      (prod.competitors || []).forEach(comp => {
        if (comp.price && finalPrices?.[prod.id]) {
          const ourPrice = Object.values(finalPrices[prod.id])[0];
          if (ourPrice && comp.price < ourPrice) {
            competitorsWithLowerPrices.push(comp.name);
          }
        }
      });
    });
    const uniqueLowerComps = [...new Set(competitorsWithLowerPrices)];
    if (uniqueLowerComps.length > 0) {
      s.threats.push({ id: 'auto_lower_prices', text: `${uniqueLowerComps.length} منافس بأسعار أقل: ${uniqueLowerComps.slice(0, 3).join('، ')}`, auto: true });
    }

    const segments = marketingData?.targetAudience?.segments || [];
    if (segments.length > 0) {
      s.opportunities.push({ id: 'auto_segments', text: `${segments.length} فئة مستهدفة محددة يمكن توجيه المحتوى لها`, auto: true });
    }

    return s;
  }, [products, suppliers, pricingData, finalPrices, marketingData]);

  const addItem = (quadrant) => {
    if (!newTexts[quadrant].trim()) return;
    const newItem = { id: `swot_${Date.now()}`, text: newTexts[quadrant].trim(), auto: false };
    onUpdate({ ...swotData, [quadrant]: [...swotData[quadrant], newItem] });
    setNewTexts(prev => ({ ...prev, [quadrant]: '' }));
  };

  const removeItem = (quadrant, id) => {
    onUpdate({ ...swotData, [quadrant]: swotData[quadrant].filter(i => i.id !== id) });
  };

  const startEdit = (quadrant, item) => {
    setEditingItem({ quadrant, id: item.id });
    setEditText(item.text);
  };

  const saveEdit = () => {
    if (!editingItem) return;
    const { quadrant, id } = editingItem;
    onUpdate({
      ...swotData,
      [quadrant]: swotData[quadrant].map(i => i.id === id ? { ...i, text: editText } : i),
    });
    setEditingItem(null);
    setEditText('');
  };

  const acceptSuggestion = (quadrant, suggestion) => {
    const exists = swotData[quadrant].some(i => i.id === suggestion.id);
    if (exists) return;
    onUpdate({ ...swotData, [quadrant]: [...swotData[quadrant], { ...suggestion }] });
  };

  const dismissSuggestion = (id) => {
    setDismissedSuggestions(prev => [...prev, id]);
  };

  const exportSWOT = () => {
    let text = '═══ تحليل SWOT — متجر مفتاح ═══\n\n';
    QUADRANTS.forEach(q => {
      text += `▸ ${q.label}:\n`;
      const items = swotData[q.key];
      if (items.length === 0) text += '  (فارغ)\n';
      items.forEach(item => { text += `  • ${item.text}\n`; });
      text += '\n';
    });
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mkt-section">
      <div className="mkt-section-block">
        <div className="mkt-section-header">
          <div className="mkt-section-header-right">
            <CompassIcon />
            <h2>تحليل SWOT الذكي</h2>
          </div>
          <button className="mkt-btn-secondary" onClick={exportSWOT}>
            <CopyIcon />
            <span>تصدير SWOT</span>
          </button>
        </div>

        <div className="swot-grid">
          {QUADRANTS.map(q => {
            const items = swotData[q.key] || [];
            const autoSuggestions = (suggestions[q.key] || []).filter(
              s => !items.some(i => i.id === s.id) && !dismissedSuggestions.includes(s.id)
            );

            return (
              <div key={q.key} className="swot-quadrant" style={{ '--swot-color': q.color, '--swot-bg': q.bgColor }}>
                <div className="swot-quadrant-header">
                  <span className="swot-quadrant-icon">{q.icon}</span>
                  <span className="swot-quadrant-label">{q.label}</span>
                  <span className="swot-quadrant-count">{items.length}</span>
                </div>

                <div className="swot-items">
                  {items.map(item => (
                    <div key={item.id} className={`swot-item ${item.auto ? 'swot-item-auto' : ''}`}>
                      {editingItem?.id === item.id ? (
                        <div className="swot-item-edit">
                          <input type="text" value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit()} autoFocus />
                          <button onClick={saveEdit}><CheckIcon /></button>
                          <button onClick={() => setEditingItem(null)}><XIcon /></button>
                        </div>
                      ) : (
                        <>
                          {item.auto && <SparklesIcon className="swot-auto-icon" />}
                          <span className="swot-item-text">{item.text}</span>
                          <div className="swot-item-actions">
                            <button onClick={() => startEdit(q.key, item)}><EditIcon /></button>
                            <button onClick={() => removeItem(q.key, item.id)}><TrashIcon /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {autoSuggestions.length > 0 && (
                  <div className="swot-suggestions">
                    <div className="swot-suggestions-title"><SparklesIcon /> اقتراحات تلقائية</div>
                    {autoSuggestions.map(s => (
                      <div key={s.id} className="swot-suggestion">
                        <span>{s.text}</span>
                        <div className="swot-suggestion-actions">
                          <button className="swot-suggestion-accept" onClick={() => acceptSuggestion(q.key, s)}>قبول</button>
                          <button className="swot-suggestion-dismiss" onClick={() => dismissSuggestion(s.id)}>تجاهل</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="swot-add">
                  <input
                    type="text"
                    placeholder={`إضافة إلى ${q.label}...`}
                    value={newTexts[q.key]}
                    onChange={e => setNewTexts(prev => ({ ...prev, [q.key]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addItem(q.key)}
                  />
                  <button onClick={() => addItem(q.key)} disabled={!newTexts[q.key].trim()}>
                    <PlusIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
