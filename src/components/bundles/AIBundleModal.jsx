import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SparklesIcon, XIcon, PackageIcon, CheckCircleIcon, PlusIcon, AlertTriangleIcon, TagIcon, DollarSignIcon } from '../Icons';
import { callAI } from '../../utils/aiProvider';

const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function AIBundleModal({ products, getSupplierPrice, costs, exchangeRate, bundles, setBundles, appSettings, onClose, onNavigateToSettings }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [addedIds, setAddedIds] = useState(new Set());

  const hasApiKey = (() => {
    const provider = appSettings?.aiProvider || 'gemini';
    if (provider === 'gemini') return !!(appSettings?.geminiApiKey);
    if (provider === 'openrouter') return !!(appSettings?.openrouterApiKey);
    if (provider === 'agentrouter') return !!(appSettings?.agentrouterApiKey);
    return false;
  })();

  const tooFewProducts = products.length < 2;

  const calculateFullCost = (productIds, sellingPrice) => {
    let fixed = 0;
    let percents = 0;
    (costs || []).filter(c => c.active).forEach(c => {
      if (c.type === 'fixed') fixed += c.value;
      else if (c.type === 'percentage') percents += c.value / 100;
    });
    const totalBaseCost = productIds.reduce((sum, pId) => {
      const p = products.find(prod => prod.id === pId);
      return sum + getSupplierPrice(p);
    }, 0);
    const price = sellingPrice || 0;
    const totalCost = totalBaseCost + fixed + (price * percents);
    const profit = price - totalCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    return { totalCost, totalBaseCost, profit, margin };
  };

  const isDuplicateBundle = (productIds) => {
    const sorted = [...productIds].map(String).sort().join(',');
    return bundles.some(b => [...b.productIds].map(String).sort().join(',') === sorted);
  };

  const buildProductSummary = () => {
    return products.map(p => {
      const supplierCost = getSupplierPrice(p);
      const plans = (p.plans || []).map(pl => {
        const name = pl.name || pl.label || 'خطة';
        const prices = pl.prices ? Object.entries(pl.prices).map(([sId, price]) => `مورد ${sId}: ${price}$`).join(', ') : '';
        return `${name}${prices ? ` (${prices})` : ''}`;
      }).join(' | ');
      return `- ${p.name} (المعرف: ${p.id}) | تكلفة المورد الأساسي: ${fmt(supplierCost)} ر.س | الخطط: ${plans || 'بدون خطط'}`;
    }).join('\n');
  };

  const buildCostSummary = () => {
    const activeCosts = (costs || []).filter(c => c.active);
    if (activeCosts.length === 0) return 'لا توجد تكاليف إضافية.';
    return activeCosts.map(c => {
      if (c.type === 'fixed') return `- ${c.name}: ${c.value} ر.س (ثابت)`;
      return `- ${c.name}: ${c.value}% (نسبة من سعر البيع)`;
    }).join('\n');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSuggestions([]);

    const systemPrompt = `أنت خبير في التسويق الرقمي وإنشاء حزم المنتجات الرقمية. مهمتك تحليل قائمة المنتجات المتاحة واقتراح حزم ذكية تزيد من المبيعات.

قواعد إنشاء الحزم:
1. كل حزمة يجب أن تحتوي على منتجين على الأقل
2. المنتجات في الحزمة يجب أن تكون متكاملة (مثلاً: أدوات التصميم معاً، أدوات الإنتاجية معاً)
3. سعر البيع المقترح = مجموع تكاليف الموردين + التكاليف الثابتة + نسبة التكاليف المتغيرة + هامش ربح معقول (15-30%)
4. لا تكرر منتجاً في أكثر من حزمة واحدة إن أمكن
5. اقترح 2-4 حزم حسب عدد المنتجات المتاحة
6. سعر البيع يجب أن يكون أكبر من صفر دائماً
7. لا تقترح حزمة تحتوي على منتج مكرر

أجب بتنسيق JSON فقط (بدون أي نص إضافي أو markdown) كمصفوفة:
[
  {
    "name": "اسم الحزمة بالعربي",
    "productIds": ["id1", "id2"],
    "sellingPrice": 99.99,
    "rationale": "سبب اختيار هذه المنتجات معاً"
  }
]`;

    const userMessage = `المنتجات المتاحة:
${buildProductSummary()}

التكاليف الإضافية:
${buildCostSummary()}

سعر الصرف: 1 USD = ${exchangeRate} SAR

الحزم الموجودة حالياً: ${bundles.length} حزمة
${bundles.map(b => `- ${b.name}: ${b.productIds.length} منتجات`).join('\n')}

اقترح حزم جديدة ذكية ومتكاملة.`;

    try {
      const response = await callAI({
        systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        appSettings,
      });

      let parsed;
      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error('تعذر تحليل رد الذكاء الاصطناعي');
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('لم يقترح الذكاء الاصطناعي أي حزم');
      }

      const normalizeId = (id) => {
        const asStr = String(id);
        const match = products.find(p => String(p.id) === asStr);
        return match ? match.id : null;
      };

      const validated = parsed.filter(s => {
        if (!s.name || !Array.isArray(s.productIds) || s.productIds.length < 2) return false;
        const normalized = s.productIds.map(normalizeId).filter(Boolean);
        const uniqueIds = [...new Set(normalized)];
        if (uniqueIds.length < 2) return false;
        const price = parseFloat(s.sellingPrice);
        if (!price || price <= 0) return false;
        return true;
      }).map(s => {
        const normalized = s.productIds.map(normalizeId).filter(Boolean);
        const uniqueIds = [...new Set(normalized)];
        const sellingPrice = parseFloat(s.sellingPrice);
        const { totalBaseCost } = calculateFullCost(uniqueIds, sellingPrice);
        return {
          ...s,
          productIds: uniqueIds,
          sellingPrice,
          totalSupplierCost: totalBaseCost,
          isDuplicate: isDuplicateBundle(uniqueIds),
        };
      });

      if (validated.length === 0) {
        throw new Error('الاقتراحات لا تحتوي على منتجات صالحة');
      }

      setSuggestions(validated);
    } catch (err) {
      if (err.message === 'NO_KEY') {
        setError('لم يتم تهيئة مفتاح API. يرجى الذهاب إلى الإعدادات → الذكاء الاصطناعي لإضافة المفتاح.');
      } else {
        setError(err.message || 'حدث خطأ أثناء توليد الاقتراحات');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddBundle = (suggestion) => {
    const newBundle = {
      id: `bundle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: suggestion.name,
      productIds: suggestion.productIds,
      sellingPrice: suggestion.sellingPrice,
      totalSupplierCost: suggestion.totalSupplierCost,
      createdAt: new Date().toISOString(),
    };
    setBundles(prev => [...prev, newBundle]);
    setAddedIds(prev => new Set(prev).add([...suggestion.productIds].map(String).sort().join(',')));
  };

  const modalRoot = document.getElementById('modal-root') || document.body;
  return createPortal(
    <div className="ai-bundle-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ai-bundle-modal" role="dialog" aria-modal="true" aria-labelledby="ai-bundle-title">
        <div className="ai-bundle-header">
          <div className="ai-bundle-header-title">
            <div className="ai-bundle-header-icon">
              <SparklesIcon className="icon-lg" />
            </div>
            <div>
              <h3 id="ai-bundle-title">اقتراح حزم بالذكاء الاصطناعي</h3>
              <p>تحليل المنتجات واقتراح حزم ذكية لزيادة المبيعات</p>
            </div>
          </div>
          <button className="ai-bundle-close" onClick={onClose} aria-label="إغلاق">
            <XIcon className="icon-md" />
          </button>
        </div>

        <div className="ai-bundle-body">
          {!hasApiKey ? (
            <div className="ai-bundle-no-key">
              <AlertTriangleIcon className="icon-xl" />
              <h4>مفتاح API غير مهيأ</h4>
              <p>يرجى الذهاب إلى صفحة الإعدادات → تبويب الذكاء الاصطناعي وإدخال مفتاح API لتفعيل هذه الميزة.</p>
              {onNavigateToSettings && (
                <button className="ai-bundle-generate-btn" onClick={() => { onClose(); onNavigateToSettings(); }} style={{ marginTop: '8px', fontSize: '13px', padding: '10px 20px' }}>
                  الذهاب إلى الإعدادات
                </button>
              )}
            </div>
          ) : tooFewProducts ? (
            <div className="ai-bundle-no-key">
              <PackageIcon className="icon-xl" />
              <h4>عدد المنتجات غير كافٍ</h4>
              <p>يجب أن يكون لديك منتجان على الأقل لإنشاء حزمة. أضف مزيداً من المنتجات أولاً.</p>
            </div>
          ) : (
            <>
              <div className="ai-bundle-info">
                <div className="ai-bundle-info-item">
                  <PackageIcon className="icon-sm" />
                  <span>{products.length} منتج متاح</span>
                </div>
                <div className="ai-bundle-info-item">
                  <TagIcon className="icon-sm" />
                  <span>{bundles.length} حزمة حالية</span>
                </div>
              </div>

              <div className="ai-bundle-products-list">
                <div className="ai-bundle-products-header">
                  <PackageIcon className="icon-sm" />
                  <span>المنتجات المتاحة للتجميع</span>
                </div>
                <div className="ai-bundle-products-grid">
                  {products.map(p => {
                    const cost = getSupplierPrice(p);
                    const planCount = (p.plans || []).length;
                    return (
                      <div key={p.id} className="ai-bundle-product-chip">
                        <span className="ai-bundle-product-name">{p.name}</span>
                        <span className="ai-bundle-product-meta">
                          {fmt(cost)} ر.س · {planCount} {planCount === 1 ? 'خطة' : 'خطط'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {!loading && suggestions.length === 0 && !error && (
                <div className="ai-bundle-prompt">
                  <p>اضغط الزر أدناه ليقوم الذكاء الاصطناعي بتحليل منتجاتك واقتراح حزم مثالية</p>
                  <button className="ai-bundle-generate-btn" onClick={handleGenerate}>
                    <SparklesIcon className="icon-sm" /> اقتراح حزم ذكية
                  </button>
                </div>
              )}

              {loading && (
                <div className="ai-bundle-loading">
                  <div className="ai-bundle-spinner" />
                  <p>جاري تحليل المنتجات واقتراح الحزم...</p>
                </div>
              )}

              {error && (
                <div className="ai-bundle-error">
                  <AlertTriangleIcon className="icon-md" />
                  <p>{error}</p>
                  <button className="ai-bundle-retry-btn" onClick={handleGenerate}>
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="ai-bundle-suggestions">
                  <div className="ai-bundle-suggestions-header">
                    <h4><SparklesIcon className="icon-sm" /> الحزم المقترحة ({suggestions.length})</h4>
                    <button className="ai-bundle-regenerate-btn" onClick={handleGenerate}>
                      إعادة التوليد
                    </button>
                  </div>
                  {suggestions.map((s, idx) => {
                    const isAdded = addedIds.has([...s.productIds].map(String).sort().join(','));
                    const { profit, margin } = calculateFullCost(s.productIds, s.sellingPrice);
                    return (
                      <div key={idx} className={`ai-bundle-suggestion-card ${isAdded ? 'ai-bundle-added' : ''}`}>
                        <div className="ai-suggestion-top">
                          <div className="ai-suggestion-index">{idx + 1}</div>
                          <div className="ai-suggestion-info">
                            <h5>{s.name}</h5>
                            <p className="ai-suggestion-rationale">{s.rationale}</p>
                          </div>
                          {isAdded ? (
                            <div className="ai-suggestion-added-badge">
                              <CheckCircleIcon className="icon-sm" /> تمت الإضافة
                            </div>
                          ) : s.isDuplicate ? (
                            <div className="ai-suggestion-duplicate-badge">
                              <AlertTriangleIcon className="icon-sm" /> حزمة مكررة
                            </div>
                          ) : (
                            <button className="ai-suggestion-add-btn" onClick={() => handleAddBundle(s)}>
                              <PlusIcon className="icon-sm" /> إضافة الحزمة
                            </button>
                          )}
                        </div>
                        <div className="ai-suggestion-products">
                          {s.productIds.map((pId, i) => {
                            const p = products.find(prod => prod.id === pId);
                            return (
                              <span key={`${pId}-${i}`} className="po-product-chip">
                                <span className="po-chip-dot" />
                                {p ? p.name : 'منتج غير معروف'}
                              </span>
                            );
                          })}
                        </div>
                        <div className="ai-suggestion-pricing">
                          <div className="ai-suggestion-price-item">
                            <DollarSignIcon className="icon-xs" />
                            <span>التكلفة الكاملة: {fmt(s.sellingPrice - profit)} ر.س</span>
                          </div>
                          <div className="ai-suggestion-price-item ai-suggestion-price-sell">
                            <TagIcon className="icon-xs" />
                            <span>سعر البيع: {fmt(s.sellingPrice)} ر.س</span>
                          </div>
                          <div className={`ai-suggestion-price-item ${profit > 0 ? 'ai-suggestion-price-profit' : 'ai-suggestion-price-loss'}`}>
                            <span>الربح: {profit > 0 ? '+' : ''}{fmt(profit)} ر.س ({margin.toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
}

export default AIBundleModal;
