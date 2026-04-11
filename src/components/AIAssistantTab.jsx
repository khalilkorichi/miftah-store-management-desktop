import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SparklesIcon, SendIcon, RefreshIcon, CopyIcon, CheckCircleIcon,
  SettingsIcon, XIcon, ZapIcon, AlertTriangleIcon, KeyIcon,
  ChevronDownIcon, PackageIcon, PlusIcon, TrashIcon, ClockIcon,
  FileTextIcon, TagIcon, ListIcon,
} from './Icons';
import { callAI } from '../utils/aiProvider';
import MarkdownRenderer from './MarkdownRenderer';

/* ─── Conversation persistence helpers ──────────────────────────────────── */
const CHATS_KEY = 'miftah_ai_chats';

function loadChats(productId) {
  try {
    const all = JSON.parse(localStorage.getItem(CHATS_KEY) || '{}');
    return Array.isArray(all[productId]) ? all[productId] : [];
  } catch { return []; }
}

function saveChats(productId, conversations) {
  try {
    const all = JSON.parse(localStorage.getItem(CHATS_KEY) || '{}');
    all[productId] = conversations;
    localStorage.setItem(CHATS_KEY, JSON.stringify(all));
  } catch (e) { console.error('AI chats save error:', e); }
}

function makeConvId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function makeEmptyConv() {
  return { id: makeConvId(), title: 'محادثة جديدة', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
}

function makeConvTitle(messages) {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'محادثة جديدة';
  const text = (first.content || '').trim();
  return text.length > 38 ? text.slice(0, 38) + '…' : text;
}

function formatConvDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'الآن';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} د`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} س`;
  return d.toLocaleDateString('ar', { month: 'short', day: 'numeric' });
}

/* ─── Default system prompt ─────────────────────────────────────────────── */
export const DEFAULT_AI_PROMPT = `أنت مساعد ذكاء اصطناعي خبير في التسويق الرقمي وكتابة المحتوى للمتاجر الإلكترونية في المنطقة العربية.

مهمتك الأساسية: مساعدة مدير متجر رقمي (على منصة سلة) على:
1. توليد أوصاف تسويقية احترافية وجاهزة للنشر للمنتجات الرقمية
2. تحسين وتعديل الأوصاف الموجودة
3. الإجابة على أسئلة المستخدم حول المنتج

أنواع المنتجات في المتجر:
- منتج مستقل/عادي: ليس له parentId ولا فروع — يظهر في جميع الصفحات
- فرع: له parentId يشير إلى وعاء مفرع — يظهر كمنتج مستقل في جميع الصفحات
- وعاء مفرع: له فروع مرتبطة — يُعرض فقط في صفحة المنتجات كحاوية

فهم الأسعار في المتجر:
- السعر الرسمي (officialPriceUsd): هو سعر المنتج المعلن من الشركة المصنعة بالدولار — يُستخدم للمقارنة فقط وليس سعر البيع
- أسعار الموردين (prices): هي تكلفة شراء المنتج من الموردين بالدولار
- سعر البيع النهائي (finalPrice): هو السعر الفعلي الذي يبيع به المتجر للعملاء بالريال السعودي — يحدده المستخدم في صفحة إدارة التسعير (تبويبة الأسعار النهائية)
- عند سؤالك عن سعر بيع منتج، استخدم سعر البيع النهائي (finalPrice) إن وُجد
- إذا لم يُحدد سعر البيع النهائي بعد لخطة معينة، قم بتحليل البيانات المتاحة واقترح سعر بيع مناسب بالريال السعودي بناءً على:
  1. تكلفة المورد (أقل سعر مورد × سعر الصرف)
  2. التكاليف التشغيلية المفعّلة (ثابتة ونسبية) المذكورة في بيانات المنتج
  3. هامش ربح معقول (عادة 20-35% حسب نوع المنتج)
  4. أسعار المنافسين إن وُجدت
  5. آلية التسعير المستخدمة للمنتج إن وُجدت (تكلفة+هامش، قيمة مدركة، تسعير نفسي)
  اشرح كيف وصلت للسعر المقترح بشكل مختصر
- لا تعتبر السعر الرسمي سعر بيع أبداً

قواعد الكتابة:
- اكتب بالعربية الفصحى السهلة والمفهومة
- الأسلوب: تسويقي، مقنع، واضح، يعكس القيمة للعميل
- تجنب المبالغة والادعاءات الكاذبة
- استخدم البيانات المقدمة عن المنتج فقط
- عند اقتراح أسعار بيع أو تسعير، استخدم الريال السعودي (ر.س) كعملة افتراضية. لا تستخدم الدولار إلا إذا طلب المستخدم ذلك صراحةً
- عند ذكر السعر الرسمي، وضّح دائماً أنه سعر مرجعي للمقارنة وليس سعر البيع

عند توليد وصف للمتجر:
- ابدأ بجملة تعريفية قوية تبرز قيمة المنتج
- أبرز المزايا والخطط المتاحة
- اذكر طريقة التفعيل وشروط الضمان إن وجدت
- اختم بعبارة تحفيزية للشراء

إذا طلب المستخدم تطبيق أي تعديل مباشرة في قاعدة البيانات، أجب بشكل طبيعي ثم أضف كتلة MIFTAH_ACTION واحدة في نهاية ردك:

لتحديث الوصف:
[MIFTAH_ACTION]
{"type":"updateDescription","description":"النص الجديد هنا"}
[/MIFTAH_ACTION]

لتحديث التفاصيل:
[MIFTAH_ACTION]
{"type":"updateDetails","details":"التفاصيل الجديدة"}
[/MIFTAH_ACTION]

لتحديث سعر خطة من مورد معين (استخدم planId و supplierId كما وردا في بيانات المنتج):
[MIFTAH_ACTION]
{"type":"updatePlanPrice","planId":"plan_xxx","supplierId":1,"price":19.99}
[/MIFTAH_ACTION]

لتحديث السعر الرسمي لخطة:
[MIFTAH_ACTION]
{"type":"updateOfficialPrice","planId":"plan_xxx","price":29.99}
[/MIFTAH_ACTION]

لإضافة ميزة إلى خطة:
[MIFTAH_ACTION]
{"type":"addFeature","planId":"plan_xxx","text":"نص الميزة الجديدة"}
[/MIFTAH_ACTION]

لتعديل نص ميزة موجودة (استخدم featureId كما ورد في بيانات المنتج):
[MIFTAH_ACTION]
{"type":"editFeature","planId":"plan_xxx","featureId":"feat_yyy","text":"النص المعدّل"}
[/MIFTAH_ACTION]

لحذف ميزة من خطة:
[MIFTAH_ACTION]
{"type":"removeFeature","planId":"plan_xxx","featureId":"feat_yyy"}
[/MIFTAH_ACTION]

لإنشاء حزمة منتجات جديدة (اختر منتجات من القائمة المتاحة واقترح سعر بيع مناسب بالريال السعودي):
[MIFTAH_ACTION]
{"type":"createBundle","name":"اسم الحزمة","productIds":[1,2,3],"sellingPrice":99.99,"rationale":"سبب اقتراح هذه الحزمة"}
[/MIFTAH_ACTION]`;

/* ─── Product context builder ───────────────────────────────────────────── */
function buildProductContext(product, suppliers, durations, activationMethods, allProducts = [], finalPrices = {}, costs = [], exchangeRate = 1) {
  if (!product) return '';
  const lines = ['=== بيانات المنتج الحالي ==='];

  lines.push(`الاسم: ${product.name}`);

  if (product.parentId) {
    const parent = allProducts.find(p => p.id === product.parentId);
    lines.push(`نوع المنتج: فرع (تابع للوعاء: ${parent ? parent.name : product.parentId})`);
  } else {
    const hasBranches = allProducts.some(p => p.parentId === product.id);
    lines.push(`نوع المنتج: ${hasBranches ? 'وعاء مفرع (له فروع)' : 'منتج مستقل'}`);
  }

  if (product.accountType) {
    lines.push(`نوع الحساب: ${product.accountType === 'individual' ? 'فردي' : 'عائلي/مشترك'}`);
  }

  if (product.details?.trim()) {
    lines.push(`التفاصيل: ${product.details}`);
  }

  if (product.description) {
    const stripped = product.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (stripped) lines.push(`الوصف الحالي: ${stripped}`);
  }

  if (product.activationMethods?.length > 0) {
    const methods = product.activationMethods.map(mId => {
      const m = activationMethods.find(am => am.id === mId);
      return m ? `${m.icon} ${m.label}` : mId;
    });
    lines.push(`طرق التفعيل: ${methods.join('، ')}`);
  }

  const comps = product.competitors || [];
  if (comps.length > 0) {
    lines.push('\n=== المنافسون ===');
    comps.forEach(c => {
      const priceStr = c.price != null ? `${c.price} ر.س` : 'غير محدد';
      lines.push(`  - ${c.name}: السعر ${priceStr} | الرابط: ${c.url}`);
    });
    lines.push('ملاحظة: يمكنك مقارنة أسعار هذا المنتج مع أسعار المنافسين وتقديم توصيات تسعيرية.');
  }

  if (product.plans?.length > 0) {
    lines.push('\n=== الخطط والأسعار ===');
    product.plans.forEach(plan => {
      const dur = durations.find(d => d.id === plan.durationId);
      const durLabel = dur ? dur.label : plan.durationId;
      lines.push(`\nالخطة: ${durLabel} [planId: ${plan.id}]`);

      const prices = Object.entries(plan.prices || {})
        .map(([supId, price]) => {
          if (!price) return null;
          const sup = suppliers.find(s => String(s.id) === String(supId));
          return sup ? `${sup.name} [supplierId: ${sup.id}]: $${price}` : `[supplierId: ${supId}]: $${price}`;
        })
        .filter(Boolean);
      if (prices.length > 0) lines.push(`  الأسعار من الموردين: ${prices.join('، ')}`);

      if (plan.officialPriceUsd) lines.push(`  السعر الرسمي (للمقارنة فقط — ليس سعر البيع): $${plan.officialPriceUsd}`);
      const planKey = `${product.id}_${plan.id}`;
      const finalPrice = finalPrices[planKey];
      if (finalPrice !== undefined && finalPrice !== null) {
        lines.push(`  سعر البيع النهائي: ${finalPrice} ر.س`);
      } else {
        lines.push(`  سعر البيع النهائي: لم يُحدد بعد (يُحدد من صفحة إدارة التسعير → الأسعار النهائية)`);
      }

      const warrantyEntries = Object.entries(plan.supplierWarranty || {})
        .map(([supId, days]) => {
          if (!days) return null;
          const sup = suppliers.find(s => String(s.id) === String(supId));
          return sup ? `${sup.name}: ${days} يوم` : null;
        })
        .filter(Boolean);
      if (warrantyEntries.length > 0) lines.push(`  الضمان: ${warrantyEntries.join('، ')}`);

      if (plan.warrantyDays > 0) lines.push(`  ضمان الخطة: ${plan.warrantyDays} يوم`);

      const features = (plan.features || [])
        .filter(f => !f.isSeparator && f.text?.trim())
        .map(f => `• [featureId: ${f.id}] ${f.text}`);
      if (features.length > 0) lines.push(`  المزايا:\n  ${features.join('\n  ')}`);
    });
  }

  const activeCosts = (costs || []).filter(c => c.active !== false);
  if (activeCosts.length > 0) {
    lines.push('\n=== التكاليف التشغيلية المفعّلة ===');
    activeCosts.forEach(c => {
      if (c.type === 'fixed') {
        lines.push(`  - ${c.name}: ${c.value} ر.س (ثابت)`);
      } else if (c.type === 'percentage') {
        lines.push(`  - ${c.name}: ${c.value}% (نسبي من السعر)`);
      }
    });
  }

  if (exchangeRate) {
    lines.push(`\nسعر صرف الدولار: 1 USD = ${exchangeRate} ر.س`);
  }

  return lines.join('\n');
}

function parseActionFromText(text) {
  const match = text.match(/\[MIFTAH_ACTION\]\s*([\s\S]*?)\s*\[\/MIFTAH_ACTION\]/);
  if (!match) return { clean: text, action: null };

  const clean = text.replace(/\[MIFTAH_ACTION\][\s\S]*?\[\/MIFTAH_ACTION\]/, '').trim();
  try {
    const action = JSON.parse(match[1].trim());
    return { clean, action };
  } catch {
    return { clean: text, action: null };
  }
}

function textToHtml(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => `<p>${line}</p>`)
    .join('');
}

/* ─── MessageBubble ─────────────────────────────────────────────────────── */
function MessageBubble({ msg, onApplyDescription, product }) {
  const [copied, setCopied] = useState(false);
  const isAI = msg.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.displayContent || msg.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`ai-message ${isAI ? 'ai-message-ai' : 'ai-message-user'}`}>
      {isAI && (
        <div className="ai-message-avatar">
          <SparklesIcon className="icon-xs" />
        </div>
      )}
      <div className="ai-message-bubble">
        <div className="ai-message-content">
          {isAI
            ? <MarkdownRenderer content={msg.displayContent || msg.content} />
            : <p className="md-p">{msg.displayContent || msg.content}</p>
          }
        </div>
        {isAI && (
          <div className="ai-message-actions">
            <button className="ai-msg-btn" onClick={handleCopy} title="نسخ">
              {copied ? <CheckCircleIcon className="icon-xs" /> : <CopyIcon className="icon-xs" />}
              {copied ? 'تم النسخ' : 'نسخ'}
            </button>
            {onApplyDescription && product && (
              msg.action?.type === 'updateDescription' ||
              (!msg.action && (msg.displayContent || msg.content || '').length > 150)
            ) && (
              <button
                className="ai-msg-btn ai-msg-btn-apply"
                onClick={() => onApplyDescription(
                  msg.action?.description || msg.displayContent || msg.content
                )}
                title="تطبيق هذا الوصف على المنتج"
              >
                <CheckCircleIcon className="icon-xs" />
                تطبيق على المنتج
              </button>
            )}
          </div>
        )}
      </div>
      {!isAI && (
        <div className="ai-message-avatar ai-message-avatar-user">
          <span>أنت</span>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
function AIAssistantTab({
  product,
  products,
  suppliers,
  durations,
  activationMethods,
  appSettings,
  onAppSettingsChange,
  updateProduct,
  onNavigateToSettings,
  onSelectProduct,
  bundles,
  setBundles,
  costs,
  pricingData,
  exchangeRate,
  finalPrices,
}) {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(
    appSettings?.aiCustomPrompt || DEFAULT_AI_PROMPT
  );
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const activeConvIdRef = useRef(null);
  const productIdRef = useRef(null);

  /* keep refs fresh */
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);
  useEffect(() => { productIdRef.current = product?.id; }, [product?.id]);

  /* ── Load / init conversations when product changes ── */
  useEffect(() => {
    if (!product?.id) return;
    const convs = loadChats(product.id);
    if (convs.length > 0) {
      setConversations(convs);
      setActiveConvId(convs[0].id);
      setMessages(convs[0].messages);
    } else {
      const newConv = makeEmptyConv();
      setConversations([newConv]);
      setActiveConvId(newConv.id);
      setMessages([]);
      saveChats(product.id, [newConv]);
    }
    setError('');
    setPendingAction(null);
    setInput('');
  }, [product?.id]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    setCustomPrompt(appSettings?.aiCustomPrompt || DEFAULT_AI_PROMPT);
  }, [appSettings?.aiCustomPrompt]);

  /* ── Sync messages → conversations + localStorage ── */
  const syncConv = (msgs) => {
    const pid = productIdRef.current;
    const cid = activeConvIdRef.current;
    if (!pid || !cid) return;
    setConversations(prevConvs => {
      const existing = prevConvs.find(c => c.id === cid);
      if (!existing) return prevConvs;
      const title = msgs.length > 0 ? makeConvTitle(msgs) : existing.title;
      const updated = prevConvs.map(c =>
        c.id === cid ? { ...c, messages: msgs, title, updatedAt: Date.now() } : c
      );
      saveChats(pid, updated);
      return updated;
    });
  };

  const hasApiKey = Boolean(
    appSettings?.aiProvider === 'openrouter' ? appSettings?.openrouterApiKey :
    appSettings?.aiProvider === 'agentrouter' ? appSettings?.agentrouterApiKey :
    appSettings?.geminiApiKey
  );

  const getSupplierPrice = useCallback((prod) => {
    if (!prod || !prod.plans || prod.plans.length === 0) return 0;
    const plan = prod.plans[0];
    const savedConfig = (pricingData || {})[prod.id] || {};
    const supplierId = savedConfig.primarySupplierId || suppliers[0]?.id;
    return (plan.prices?.[supplierId] || 0) * (exchangeRate || 1);
  }, [pricingData, suppliers, exchangeRate]);

  const getSystemPrompt = useCallback(() => {
    const ctx = buildProductContext(product, suppliers, durations, activationMethods, products, finalPrices, costs, exchangeRate);
    let allProductsCtx = '';
    if (products && products.length > 0) {
      const lines = [`\n\n=== جميع منتجات المتجر (${products.length} منتج) — لاقتراح الحزم ===`];
      products.forEach(p => {
        const cost = getSupplierPrice(p);
        lines.push(`  - [id: ${p.id}] ${p.name} | تكلفة المورد: ${cost.toFixed(2)} ر.س`);
      });
      if (bundles && bundles.length > 0) {
        lines.push(`\nالحزم الموجودة حالياً (${bundles.length}):`);
        bundles.forEach(b => {
          lines.push(`  - ${b.name}: المنتجات [${(b.productIds || []).join(', ')}] | سعر البيع: ${b.sellingPrice || 0} ر.س`);
        });
      }
      allProductsCtx = lines.join('\n');
    }
    return `${customPrompt}\n\n${ctx}${allProductsCtx}`;
  }, [product, suppliers, durations, activationMethods, customPrompt, products, bundles, getSupplierPrice, finalPrices, costs, exchangeRate]);

  /* ── Conversation management ── */
  const startNewConversation = useCallback(() => {
    if (!product?.id) return;
    const newConv = makeEmptyConv();
    const updated = [newConv, ...conversations];
    saveChats(product.id, updated);
    setConversations(updated);
    setActiveConvId(newConv.id);
    setMessages([]);
    setPendingAction(null);
    setError('');
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [product?.id, conversations]);

  const switchConversation = useCallback((convId) => {
    if (convId === activeConvId || isLoading) return;
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    setActiveConvId(convId);
    setMessages(conv.messages);
    setPendingAction(null);
    setError('');
    setInput('');
  }, [activeConvId, conversations, isLoading]);

  const deleteConversation = useCallback((convId, e) => {
    e?.stopPropagation();
    if (!product?.id) return;
    let updated = conversations.filter(c => c.id !== convId);
    if (updated.length === 0) {
      updated = [makeEmptyConv()];
    }
    saveChats(product.id, updated);
    setConversations(updated);
    if (convId === activeConvId) {
      const first = updated[0];
      setActiveConvId(first.id);
      setMessages(first.messages);
      setPendingAction(null);
      setError('');
    }
  }, [product?.id, activeConvId, conversations]);

  /* ── AI Handlers ── */
  const handleGenerate = async () => {
    if (!product || isLoading) return;
    setIsLoading(true);
    setError('');

    const userMsg = {
      role: 'user',
      content: `اكتب وصفاً تسويقياً احترافياً وجاهزاً للنشر في متجر سلة لمنتج "${product.name}". الوصف يجب أن يكون مقنعاً وشاملاً لجميع الخطط والمزايا المتاحة.`,
      id: `u_${Date.now()}`,
    };
    const initMsgs = [userMsg];
    setMessages(initMsgs);
    syncConv(initMsgs);

    try {
      const result = await callAI({
        systemPrompt: getSystemPrompt(),
        messages: [{ role: userMsg.role, content: userMsg.content }],
        appSettings,
      });

      const { clean, action } = parseActionFromText(result);
      if (action) setPendingAction(action);

      const aiMsg = { role: 'assistant', content: clean, displayContent: clean, action, id: `a_${Date.now()}` };
      const finalMsgs = [...initMsgs, aiMsg];
      setMessages(finalMsgs);
      syncConv(finalMsgs);
    } catch (e) {
      if (e.message === 'NO_KEY') {
        setError('لم يتم تعيين مفتاح API. يرجى إضافته من صفحة الإعدادات.');
      } else {
        setError(`حدث خطأ: ${e.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || !product) return;

    const userMsg = { role: 'user', content: text, id: `u_${Date.now()}` };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    syncConv(nextMessages);
    setInput('');
    setIsLoading(true);
    setError('');

    const apiMessages = nextMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const result = await callAI({
        systemPrompt: getSystemPrompt(),
        messages: apiMessages,
        appSettings,
      });

      const { clean, action } = parseActionFromText(result);
      if (action) setPendingAction(action);

      const aiMsg = { role: 'assistant', content: clean, displayContent: clean, action, id: `a_${Date.now()}` };
      const finalMsgs = [...nextMessages, aiMsg];
      setMessages(finalMsgs);
      syncConv(finalMsgs);
    } catch (e) {
      if (e.message === 'NO_KEY') {
        setError('لم يتم تعيين مفتاح API. يرجى إضافته من صفحة الإعدادات.');
      } else {
        setError(`حدث خطأ: ${e.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplyDescription = (text) => {
    if (!product) return;
    const html = textToHtml(text);
    updateProduct(product.id, { description: html });
  };

  const handleConfirmAction = () => {
    if (!pendingAction || !product) return;
    const { type } = pendingAction;

    if (type === 'updateDescription') {
      const desc = typeof pendingAction.description === 'string' ? pendingAction.description : '';
      if (!desc.trim()) { setPendingAction(null); return; }
      const html = textToHtml(desc);
      updateProduct(product.id, { description: html });

    } else if (type === 'updateDetails') {
      const details = typeof pendingAction.details === 'string' ? pendingAction.details : '';
      updateProduct(product.id, { details });

    } else if (type === 'updatePlanPrice') {
      const price = parseFloat(pendingAction.price);
      const supplierId = pendingAction.supplierId;
      if (!pendingAction.planId || isNaN(price) || price < 0 || supplierId == null) {
        setPendingAction(null); return;
      }
      const updatedPlans = (product.plans || []).map(plan => {
        if (String(plan.id) !== String(pendingAction.planId)) return plan;
        return { ...plan, prices: { ...(plan.prices || {}), [String(supplierId)]: price } };
      });
      updateProduct(product.id, { plans: updatedPlans });

    } else if (type === 'updateOfficialPrice') {
      const price = parseFloat(pendingAction.price);
      if (!pendingAction.planId || isNaN(price) || price < 0) {
        setPendingAction(null); return;
      }
      const updatedPlans = (product.plans || []).map(plan => {
        if (String(plan.id) !== String(pendingAction.planId)) return plan;
        return { ...plan, officialPriceUsd: price };
      });
      updateProduct(product.id, { plans: updatedPlans });

    } else if (type === 'addFeature') {
      const text = typeof pendingAction.text === 'string' ? pendingAction.text.trim() : '';
      if (!pendingAction.planId || !text) { setPendingAction(null); return; }
      const updatedPlans = (product.plans || []).map(plan => {
        if (String(plan.id) !== String(pendingAction.planId)) return plan;
        const newFeature = { id: `feat_${Date.now()}`, text, isSeparator: false };
        return { ...plan, features: [...(plan.features || []), newFeature] };
      });
      updateProduct(product.id, { plans: updatedPlans });

    } else if (type === 'editFeature') {
      const text = typeof pendingAction.text === 'string' ? pendingAction.text.trim() : '';
      if (!pendingAction.planId || !pendingAction.featureId || !text) {
        setPendingAction(null); return;
      }
      const updatedPlans = (product.plans || []).map(plan => {
        if (String(plan.id) !== String(pendingAction.planId)) return plan;
        return {
          ...plan,
          features: (plan.features || []).map(f =>
            String(f.id) === String(pendingAction.featureId) ? { ...f, text } : f
          ),
        };
      });
      updateProduct(product.id, { plans: updatedPlans });

    } else if (type === 'removeFeature') {
      if (!pendingAction.planId || !pendingAction.featureId) {
        setPendingAction(null); return;
      }
      const updatedPlans = (product.plans || []).map(plan => {
        if (String(plan.id) !== String(pendingAction.planId)) return plan;
        return {
          ...plan,
          features: (plan.features || []).filter(
            f => String(f.id) !== String(pendingAction.featureId)
          ),
        };
      });
      updateProduct(product.id, { plans: updatedPlans });

    } else if (type === 'createBundle') {
      if (!pendingAction.name?.trim() || !Array.isArray(pendingAction.productIds) || pendingAction.productIds.length < 2) {
        setPendingAction(null); return;
      }
      const normalizedIds = [...new Set(
        pendingAction.productIds
          .map(aiId => products.find(p => String(p.id) === String(aiId))?.id)
          .filter(Boolean)
      )];
      if (normalizedIds.length < 2) { setPendingAction(null); return; }
      const sortedKey = [...normalizedIds].map(String).sort().join(',');
      const isDuplicate = (bundles || []).some(b =>
        [...(b.productIds || [])].map(String).sort().join(',') === sortedKey
      );
      if (isDuplicate) { setPendingAction(null); return; }
      const sellingPrice = parseFloat(pendingAction.sellingPrice) || 0;
      if (sellingPrice <= 0) { setPendingAction(null); return; }
      const totalSupplierCost = normalizedIds.reduce((sum, pId) => {
        const p = products.find(pr => pr.id === pId);
        return sum + getSupplierPrice(p);
      }, 0);
      const newBundle = {
        id: `bundle_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name: pendingAction.name.trim(),
        productIds: normalizedIds,
        sellingPrice,
        totalSupplierCost,
        createdAt: Date.now(),
      };
      setBundles?.(prev => [...prev, newBundle]);
    }

    setPendingAction(null);
  };

  const handleSavePrompt = () => {
    if (onAppSettingsChange && appSettings) {
      onAppSettingsChange({ ...appSettings, aiCustomPrompt: customPrompt });
    }
    setShowPromptEditor(false);
  };

  /* ── Empty state ── */
  if (!product) {
    if (products && products.length > 0 && onSelectProduct) {
      return (
        <div className="pf-products-grid">
          {products.map((p, i) => {
            const hasDesc = !!(p.description && p.description.replace(/<[^>]*>/g, '').trim());
            const totalFeatures = (p.plans || []).reduce((sum, pl) => sum + (pl.features || []).length, 0);
            const planCount = (p.plans || []).length;
            const cardColor = p.cardColor || null;
            const cardStyle = cardColor ? { '--card-accent': cardColor, borderInlineEnd: `3px solid ${cardColor}` } : {};
            return (
              <div
                key={p.id}
                className={`pf-product-card ${cardColor ? 'pf-product-card--colored' : ''}`}
                style={cardStyle}
                onClick={() => onSelectProduct(String(p.id))}
              >
                {cardColor && (
                  <div className="pf-product-card-color-bar" style={{ background: `linear-gradient(135deg, ${cardColor}22 0%, transparent 60%)` }} />
                )}
                <div className="pf-product-card-header">
                  <span className="pf-product-card-index">{i + 1}</span>
                  <h4 className="pf-product-card-name">{p.name}</h4>
                  {hasDesc ? (
                    <span className="pf-product-card-badge pf-badge-complete"><CheckCircleIcon className="icon-xs" /> مكتمل</span>
                  ) : (
                    <span className="pf-product-card-badge pf-badge-pending"><AlertTriangleIcon className="icon-xs" /> بدون وصف</span>
                  )}
                </div>
                <div className="pf-product-card-meta">
                  <span className="pf-product-card-chip"><TagIcon className="icon-xs" /> {planCount} خطة</span>
                  <span className="pf-product-card-chip"><ListIcon className="icon-xs" /> {totalFeatures} ميزة</span>
                </div>
                {hasDesc && (
                  <div className="pf-product-card-preview">
                    {p.description.replace(/<[^>]*>/g, '').substring(0, 80)}...
                  </div>
                )}
                <div className="pf-product-card-footer">
                  <button className="pf-product-card-btn pf-btn-ai" onClick={(e) => { e.stopPropagation(); onSelectProduct(String(p.id)); }}>
                    <SparklesIcon className="icon-xs" /> بدء المساعد الذكي
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <div className="ai-tab-empty">
        <div className="ai-tab-empty-icon">
          <SparklesIcon className="icon-xl" />
        </div>
        <h3>اختر منتجاً للبدء</h3>
        <p>حدد منتجاً من القائمة أعلاه لبدء توليد وصف احترافي بالذكاء الاصطناعي</p>
      </div>
    );
  }

  const providerLabel =
    appSettings?.aiProvider === 'openrouter' ? 'OpenRouter' :
    appSettings?.aiProvider === 'agentrouter' ? 'AgentRouter' :
    'Google Gemini';

  const activeModel =
    appSettings?.aiProvider === 'openrouter' ? (appSettings?.openrouterModel || 'anthropic/claude-sonnet-4.6') :
    appSettings?.aiProvider === 'agentrouter' ? (appSettings?.agentrouterModel || 'gpt-4o') :
    (appSettings?.geminiModel || 'gemini-2.5-flash');

  const nonEmptyConvs = conversations.filter(c => c.messages.length > 0 || c.id === activeConvId);
  const sidebarConvs = nonEmptyConvs.length > 0 ? nonEmptyConvs : conversations;

  return (
    <div className="ai-tab-wrap">
      {/* Header */}
      <div className="ai-tab-header">
        <div className="ai-tab-header-left">
          <div className="ai-tab-header-icon">
            <SparklesIcon className="icon-sm" />
          </div>
          <div>
            <span className="ai-tab-header-title">مساعد الذكاء الاصطناعي</span>
            <span className="ai-tab-header-badge">{providerLabel}</span>
            <span className="ai-tab-header-model">{activeModel}</span>
          </div>
        </div>
        <button
          className={`ai-settings-cog ${showPromptEditor ? 'active' : ''}`}
          onClick={() => setShowPromptEditor(v => !v)}
          title="إعدادات البرومبت"
        >
          <SettingsIcon className="icon-sm" />
        </button>
      </div>

      {/* Prompt Editor Panel */}
      {showPromptEditor && (
        <div className="ai-prompt-panel">
          <div className="ai-prompt-panel-header">
            <h4>تخصيص البرومبت</h4>
            <div className="ai-prompt-panel-actions">
              <button
                className="ai-prompt-reset-btn"
                onClick={() => setCustomPrompt(DEFAULT_AI_PROMPT)}
                title="إعادة تعيين إلى الافتراضي"
              >
                <RefreshIcon className="icon-xs" /> إعادة تعيين
              </button>
              <button className="ai-prompt-close-btn" onClick={() => setShowPromptEditor(false)}>
                <XIcon className="icon-xs" />
              </button>
            </div>
          </div>
          <p className="ai-prompt-note">
            يمكنك تخصيص التعليمات الأساسية للذكاء الاصطناعي. بيانات المنتج تُضاف تلقائياً.
          </p>
          <textarea
            className="ai-prompt-textarea"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            rows={12}
            dir="rtl"
          />
          <div className="ai-prompt-panel-footer">
            <button className="ai-prompt-cancel-btn" onClick={() => setShowPromptEditor(false)}>إلغاء</button>
            <button className="ai-prompt-save-btn" onClick={handleSavePrompt}>
              <CheckCircleIcon className="icon-xs" /> حفظ
            </button>
          </div>
        </div>
      )}

      {/* No API Key Warning */}
      {!hasApiKey && (
        <div className="ai-nokey-banner">
          <KeyIcon className="icon-sm" />
          <span>لم يتم تعيين مفتاح API للذكاء الاصطناعي.</span>
          <button className="ai-nokey-btn" onClick={onNavigateToSettings}>
            الذهاب إلى الإعدادات
          </button>
        </div>
      )}

      {/* Generate Section */}
      <div className="ai-generate-section">
        <div className="ai-generate-info">
          <PackageIcon className="icon-xs" />
          <span>المنتج الحالي: <strong>{product.name}</strong></span>
        </div>
        <button
          className="ai-generate-btn"
          onClick={handleGenerate}
          disabled={isLoading || !hasApiKey}
        >
          {isLoading && messages.length === 0 ? (
            <>
              <span className="ai-spinner" />
              جاري التوليد...
            </>
          ) : (
            <>
              <ZapIcon className="icon-sm" />
              توليد وصف للمنتج
            </>
          )}
        </button>
      </div>

      {/* Pending Action Confirmation */}
      {pendingAction && (
        <div className="ai-action-card">
          <div className="ai-action-card-icon">
            <AlertTriangleIcon className="icon-sm" />
          </div>
          <div className="ai-action-card-body">
            <strong>الذكاء الاصطناعي يطلب تعديلاً</strong>
            <p>
              {pendingAction.type === 'updateDescription' && 'تحديث وصف المنتج بالنص الجديد'}
              {pendingAction.type === 'updateDetails' && 'تحديث تفاصيل المنتج'}
              {pendingAction.type === 'updatePlanPrice' && `تعديل سعر الخطة (${pendingAction.planId}) من المورد — السعر الجديد: $${pendingAction.price}`}
              {pendingAction.type === 'updateOfficialPrice' && `تعديل السعر الرسمي للخطة (${pendingAction.planId}) إلى $${pendingAction.price}`}
              {pendingAction.type === 'addFeature' && `إضافة ميزة جديدة إلى الخطة (${pendingAction.planId}): "${pendingAction.text}"`}
              {pendingAction.type === 'editFeature' && `تعديل نص ميزة في الخطة (${pendingAction.planId}): "${pendingAction.text}"`}
              {pendingAction.type === 'removeFeature' && `حذف ميزة من الخطة (${pendingAction.planId})`}
              {pendingAction.type === 'createBundle' && (
                <span>
                  إنشاء حزمة "{pendingAction.name}" — {(pendingAction.productIds || []).length} منتجات | سعر البيع: {pendingAction.sellingPrice} ر.س
                  {pendingAction.rationale && <><br /><em style={{ fontSize: '0.85em', opacity: 0.8 }}>{pendingAction.rationale}</em></>}
                </span>
              )}
            </p>
            {pendingAction.type === 'createBundle' && pendingAction.productIds && (
              <div className="ai-bundle-products-preview">
                {pendingAction.productIds.map(pId => {
                  const p = products.find(pr => String(pr.id) === String(pId));
                  return p ? (
                    <span key={pId} className="ai-bundle-product-chip">
                      <PackageIcon className="icon-xs" /> {p.name}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
          <div className="ai-action-card-btns">
            <button className="ai-action-confirm" onClick={handleConfirmAction}>
              <CheckCircleIcon className="icon-xs" /> {pendingAction.type === 'createBundle' ? 'إدراج الحزمة' : 'موافق'}
            </button>
            <button className="ai-action-cancel" onClick={() => setPendingAction(null)}>
              <XIcon className="icon-xs" /> رفض
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="ai-error-banner">
          <AlertTriangleIcon className="icon-sm" />
          <span>{error}</span>
          {error.includes('مفتاح API') && (
            <button className="ai-nokey-btn" onClick={onNavigateToSettings}>
              الإعدادات
            </button>
          )}
        </div>
      )}

      {/* ── Chat container: sidebar + main panel ── */}
      <div className="ai-chat-container">

        {/* ── Conversations Sidebar (right in RTL) ── */}
        <div className="ai-chat-sidebar">
          <div className="ai-sidebar-header">
            <span className="ai-sidebar-title">
              <SparklesIcon className="icon-xs" />
              المحادثات
            </span>
            <button
              className="ai-sidebar-new-btn"
              onClick={startNewConversation}
              title="محادثة جديدة"
              disabled={isLoading}
            >
              <PlusIcon className="icon-xs" />
            </button>
          </div>

          <div className="ai-sidebar-list">
            {sidebarConvs.map(conv => {
              const isActive = conv.id === activeConvId;
              const hasMessages = conv.messages.length > 0;
              return (
                <div
                  key={conv.id}
                  className={`ai-sidebar-item ${isActive ? 'active' : ''} ${!hasMessages ? 'empty' : ''}`}
                  onClick={() => switchConversation(conv.id)}
                  title={conv.title}
                >
                  <div className="ai-sidebar-item-icon">
                    <SparklesIcon className="icon-xs" />
                  </div>
                  <div className="ai-sidebar-item-body">
                    <span className="ai-sidebar-item-title">{conv.title}</span>
                    <span className="ai-sidebar-item-meta">
                      <ClockIcon className="icon-xs" />
                      {formatConvDate(conv.updatedAt)}
                      {hasMessages && (
                        <span className="ai-sidebar-item-count">
                          {Math.floor(conv.messages.length / 2)} رسالة
                        </span>
                      )}
                    </span>
                  </div>
                  <button
                    className="ai-sidebar-item-del"
                    onClick={(e) => deleteConversation(conv.id, e)}
                    title="حذف المحادثة"
                  >
                    <TrashIcon className="icon-xs" />
                  </button>
                </div>
              );
            })}

            {sidebarConvs.length === 0 && (
              <div className="ai-sidebar-empty">
                <p>لا توجد محادثات</p>
              </div>
            )}
          </div>

          <div className="ai-sidebar-footer">
            <span>{sidebarConvs.length} محادثة</span>
          </div>
        </div>

        {/* ── Main Chat Panel ── */}
        <div className="ai-chat-panel">
          <div className="ai-chat-panel-header">
            <span className="ai-chat-panel-title">
              {conversations.find(c => c.id === activeConvId)?.title || 'المحادثة'}
            </span>
            <button
              className="ai-sidebar-new-btn"
              onClick={startNewConversation}
              title="محادثة جديدة"
              disabled={isLoading}
            >
              <PlusIcon className="icon-xs" />
              <span>جديدة</span>
            </button>
          </div>

          <div className="ai-chat-thread">
            {messages.length === 0 && (
              <div className="ai-chat-thread-empty">
                <SparklesIcon className="icon-sm" />
                <p>ابدأ بتوليد وصف أو اطرح سؤالاً عن المنتج</p>
              </div>
            )}
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onApplyDescription={msg.role === 'assistant' ? handleApplyDescription : null}
                product={product}
              />
            ))}
            {isLoading && messages.length > 0 && (
              <div className="ai-message ai-message-ai">
                <div className="ai-message-avatar">
                  <SparklesIcon className="icon-xs" />
                </div>
                <div className="ai-message-bubble ai-message-thinking">
                  <span className="ai-dot" /><span className="ai-dot" /><span className="ai-dot" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {messages.length > 0 && (
            <div className="ai-quick-prompts">
              {['قصّر الوصف', 'اجعله أكثر تسويقاً', 'أضف قسم FAQ', 'أضف نقاط مزايا', 'غيّر الأسلوب إلى رسمي'].map(prompt => (
                <button
                  key={prompt}
                  className="ai-quick-btn"
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="ai-chat-input-bar">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                messages.length === 0
                  ? 'اطرح سؤالاً عن المنتج أو اطلب تعديلاً...'
                  : 'اطلب تعديلاً، مثل: قصّر الوصف / أضف FAQ...'
              }
              rows={2}
              disabled={isLoading || !hasApiKey}
              dir="rtl"
            />
            <button
              className="ai-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !hasApiKey}
              title="إرسال"
            >
              {isLoading ? <span className="ai-spinner" /> : <SendIcon className="icon-sm" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AIAssistantTab;
