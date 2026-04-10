import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SparklesIcon, XIcon, ZapIcon, SendIcon, TrashIcon,
  CheckCircleIcon, AlertTriangleIcon, SettingsIcon,
  PlusIcon, ClockIcon, PackageIcon,
} from './Icons';
import { callAI } from '../utils/aiProvider';
import MarkdownRenderer from './MarkdownRenderer';
import { loadSkills } from '../data/builtinSkills';
import { matchSkill } from '../utils/skillsMatcher';

/* ─── Storage keys ───────────────────────────────────────────────────────── */
const CHATS_KEY = 'miftah_global_chats';

/* ─── System prompt ──────────────────────────────────────────────────────── */
const GLOBAL_SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي داخلي لمتجر مفتاح، متخصص في إدارة المنتجات الرقمية على منصة سلة.

مهمتك:
- الإجابة على أسئلة مدير المتجر بشكل مباشر ودقيق
- تقديم استشارة في إدارة المنتجات الرقمية والتسعير والتسويق
- تحليل بيانات المتجر المقدمة وتقديم رؤى قابلة للتطبيق
- تنفيذ أوامر مباشرة على قاعدة البيانات عند الطلب

هيكل المنتجات في المتجر — ثلاثة أنواع:
1. منتج عادي/مستقل: منتج ليس له parentId ولا فروع تحته — يظهر في جميع الصفحات كما هو
2. منتج مفرع (وعاء): منتج ليس له parentId ولكن له فروع مرتبطة به — يُعرض فقط في صفحة المنتجات والأسعار كحاوية، ولا يظهر في الصفحات الأخرى
3. فرع: منتج له parentId يشير إلى المنتج المفرع الأب — يظهر في جميع الصفحات كمنتج مستقل
في قائمة المنتجات المقدمة، يتم تضمين الفروع والمنتجات المستقلة فقط (وتستبعد الوعاءات الأب) ما لم يُذكر غير ذلك.

قواعد:
- أجب باللغة العربية الفصحى السهلة
- كن موجزاً ومباشراً في إجاباتك
- استند إلى بيانات المتجر الفعلية المقدمة في Context
- لا تختلق أرقاماً أو بيانات غير موجودة
- عند اقتراح أسعار بيع أو تسعير، استخدم الريال السعودي (ر.س) كعملة افتراضية. لا تستخدم الدولار إلا إذا طلب المستخدم ذلك صراحةً

إذا طلب المستخدم تنفيذ أمر على قاعدة البيانات، أجب بشكل طبيعي ثم أضف كتلة GLOBAL_ACTION واحدة في نهاية ردك:

لإنشاء منتج جديد:
[GLOBAL_ACTION]
{"type":"createProduct","name":"اسم المنتج","categoryId":null,"durationId":"month_1","officialPriceUsd":0}
[/GLOBAL_ACTION]

لإنشاء مورد جديد:
[GLOBAL_ACTION]
{"type":"createSupplier","name":"اسم المورد","country":"","whatsapp":"","telegram":""}
[/GLOBAL_ACTION]

لإضافة ميزة لخطة (استخدم productId و planId كما وردا في بيانات المتجر):
[GLOBAL_ACTION]
{"type":"addFeature","productId":1,"planId":1,"text":"نص الميزة"}
[/GLOBAL_ACTION]

لتحديث وصف منتج:
[GLOBAL_ACTION]
{"type":"updateDescription","productId":1,"description":"الوصف الجديد"}
[/GLOBAL_ACTION]

لتحديث تفاصيل منتج:
[GLOBAL_ACTION]
{"type":"updateDetails","productId":1,"details":"التفاصيل الجديدة"}
[/GLOBAL_ACTION]

لتحديث السعر الرسمي لخطة:
[GLOBAL_ACTION]
{"type":"updateOfficialPrice","productId":1,"planId":1,"price":29.99}
[/GLOBAL_ACTION]

لتحديث سعر خطة من مورد:
[GLOBAL_ACTION]
{"type":"updatePlanPrice","productId":1,"planId":1,"supplierId":1,"price":19.99}
[/GLOBAL_ACTION]

لإنشاء كوبون جديد:
[GLOBAL_ACTION]
{"type":"createCoupon","code":"CODE20","discountType":"percent","value":20,"minOrderAmount":0}
[/GLOBAL_ACTION]

لإنشاء حزمة منتجات جديدة (اختر منتجات من القائمة المتاحة واقترح سعر بيع مناسب بالريال السعودي):
[GLOBAL_ACTION]
{"type":"createBundle","name":"اسم الحزمة","productIds":[1,2,3],"sellingPrice":99.99,"rationale":"سبب اقتراح هذه الحزمة"}
[/GLOBAL_ACTION]`;

/* ─── Conversation helpers ───────────────────────────────────────────────── */
function loadChats() {
  try {
    const data = JSON.parse(localStorage.getItem(CHATS_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function saveChats(convs) {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(convs));
  } catch (e) { console.error('GlobalAI save error:', e); }
}

function makeId() {
  return `gc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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
  return text.length > 34 ? text.slice(0, 34) + '…' : text;
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
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

/* ─── MIFTAH_ACTION parser ───────────────────────────────────────────────── */
function parseActionFromText(text) {
  const match = text.match(/\[GLOBAL_ACTION\]\s*([\s\S]*?)\s*\[\/GLOBAL_ACTION\]/);
  if (!match) return { clean: text, action: null };
  const clean = text.replace(/\[GLOBAL_ACTION\][\s\S]*?\[\/GLOBAL_ACTION\]/, '').trim();
  try {
    const action = JSON.parse(match[1].trim());
    return { clean, action };
  } catch {
    return { clean: text, action: null };
  }
}

function actionLabel(action) {
  if (!action) return '';
  switch (action.type) {
    case 'createProduct': return `إنشاء منتج: "${action.name}"`;
    case 'createSupplier': return `إضافة مورد: "${action.name}"`;
    case 'addFeature': return `إضافة ميزة: "${action.text}"`;
    case 'updateDescription': return 'تحديث وصف المنتج';
    case 'updateDetails': return 'تحديث تفاصيل المنتج';
    case 'updateOfficialPrice': return `تحديث السعر الرسمي → $${action.price}`;
    case 'updatePlanPrice': return `تحديث سعر الخطة → $${action.price}`;
    case 'createCoupon': return `إنشاء كوبون: "${action.code}"`;
    case 'createBundle': return `إنشاء حزمة: "${action.name}" (${(action.productIds || []).length} منتجات)`;
    default: return 'تنفيذ أمر';
  }
}

/* ─── Store context builder ──────────────────────────────────────────────── */
function buildStoreContext({ products = [], allProducts = [], suppliers = [], durations = [], bundles = [], coupons = [], tasks = [], exchangeRate }) {
  const lines = ['=== ملخص بيانات متجر مفتاح ==='];

  const parentContainers = (allProducts.length > 0 ? allProducts : products).filter(p => {
    if (p.parentId) return false;
    const full = allProducts.length > 0 ? allProducts : products;
    return full.some(b => b.parentId === p.id);
  });
  if (parentContainers.length > 0) {
    lines.push(`\n🌿 وعاءات المنتجات المفرعة (${parentContainers.length}):`);
    parentContainers.forEach(p => {
      const branchCount = (allProducts.length > 0 ? allProducts : products).filter(b => b.parentId === p.id).length;
      lines.push(`  - [productId: ${p.id}] ${p.name} → ${branchCount} فروع`);
    });
  }

  lines.push(`\n📦 المنتجات المرئية (${products.length} منتج — فروع ومستقلة):`);
  products.forEach(p => {
    const typeLabel = p.parentId ? '🌿 فرع' : '📦 مستقل';
    lines.push(`  - [productId: ${p.id}] ${p.name} (${typeLabel}، ${(p.plans || []).length} خطة)`);
    (p.plans || []).forEach(plan => {
      const dur = durations.find(d => d.id === plan.durationId);
      const durLabel = dur ? dur.label : (plan.durationId || '');
      const prices = Object.entries(plan.prices || {})
        .map(([sid, v]) => v > 0 ? `مورد ${sid}: $${v}` : null)
        .filter(Boolean);
      const priceStr = prices.length ? prices.join('، ') : 'بدون سعر';
      const officialStr = plan.officialPriceUsd ? ` | رسمي: $${plan.officialPriceUsd}` : '';
      lines.push(`    • [planId: ${plan.id}] ${durLabel}: ${priceStr}${officialStr}`);
    });
    const comps = p.competitors || [];
    if (comps.length > 0) {
      lines.push(`    🔍 المنافسون (${comps.length}):`);
      comps.forEach(c => {
        const priceStr = c.price != null ? `${c.price} ر.س` : 'غير محدد';
        lines.push(`      - ${c.name}: السعر ${priceStr} | ${c.url}`);
      });
    }
  });

  if (suppliers.length > 0) {
    lines.push(`\n🏭 الموردون (${suppliers.length}):`);
    suppliers.forEach(s => {
      lines.push(`  - [supplierId: ${s.id}] ${s.name}${s.country ? ` (${s.country})` : ''}`);
    });
  }

  if (bundles.length > 0) {
    lines.push(`\n🎁 الحزم (${bundles.length}):`);
    bundles.slice(0, 8).forEach(b => {
      lines.push(`  - ${b.name || 'حزمة'}: ${(b.items || b.products || []).length} منتج`);
    });
    if (bundles.length > 8) lines.push(`  ... و ${bundles.length - 8} حزمة أخرى`);
  }

  const activeCoupons = (coupons || []).filter(c => c.isActive !== false);
  if (activeCoupons.length > 0) {
    lines.push(`\n🏷️ الكوبونات النشطة (${activeCoupons.length}):`);
    activeCoupons.slice(0, 6).forEach(c => {
      const val = c.discountType === 'percent' || c.type === 'percent'
        ? `${c.value || c.discount}%`
        : `${c.value || c.discount} ر.س`;
      lines.push(`  - ${c.code}: خصم ${val}`);
    });
  }

  const openTasks = (tasks || []).filter(t => t.status !== 'done' && t.status !== 'completed' && t.status !== 'closed');
  if (openTasks.length > 0) {
    lines.push(`\n📋 المهام المفتوحة (${openTasks.length}):`);
    openTasks.slice(0, 5).forEach(t => {
      lines.push(`  - ${t.title || t.text || 'مهمة'}`);
    });
    if (openTasks.length > 5) lines.push(`  ... و ${openTasks.length - 5} مهام أخرى`);
  }

  if (exchangeRate) {
    lines.push(`\n💱 سعر صرف الدولار: 1 USD = ${exchangeRate} ر.س`);
  }

  return lines.join('\n');
}

/* ─── TypingDots ─────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="gaa-typing-indicator">
      <div className="gaa-typing-avatar"><SparklesIcon className="icon-xs" /></div>
      <div className="gaa-typing-dots"><span /><span /><span /></div>
    </div>
  );
}

/* ─── MessageBubble ──────────────────────────────────────────────────────── */
function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isAI = msg.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`gaa-message ${isAI ? 'gaa-message-ai' : 'gaa-message-user'}`}>
      {isAI && <div className="gaa-msg-avatar"><SparklesIcon className="icon-xs" /></div>}
      <div className="gaa-msg-body">
        <div className="gaa-msg-content">
          {isAI
            ? <MarkdownRenderer content={msg.content} />
            : <p className="gaa-msg-text">{msg.content}</p>
          }
          {msg.actionLabel && (
            <div className="gaa-msg-action-tag">
              <CheckCircleIcon className="icon-xs" />
              <span>{msg.actionLabel}</span>
            </div>
          )}
        </div>
        <div className="gaa-msg-footer">
          <span className="gaa-msg-time">{formatTime(msg.timestamp)}</span>
          {isAI && (
            <button className="gaa-msg-copy" onClick={handleCopy} title="نسخ">
              {copied ? <CheckCircleIcon className="icon-xs" /> : '⎘'}
            </button>
          )}
        </div>
      </div>
      {!isAI && <div className="gaa-msg-avatar gaa-msg-avatar-user">أنت</div>}
    </div>
  );
}

/* ─── SkillBadge ─────────────────────────────────────────────────────────── */
function SkillBadge({ skill, onRemove, isAuto }) {
  return (
    <div
      className={`gaa-skill-badge ${isAuto ? 'gaa-skill-badge-auto' : ''}`}
      style={{ '--skill-color': skill.color || '#5E4FDE' }}
    >
      <span>{skill.icon || '⚡'}</span>
      <span>{skill.name || skill.label}</span>
      {isAuto && <span className="gaa-skill-badge-auto-label">تلقائي</span>}
      {onRemove && (
        <button onClick={onRemove} className="gaa-skill-badge-remove" title="إلغاء المهارة">
          <XIcon className="icon-xs" />
        </button>
      )}
    </div>
  );
}

/* ─── ConversationSidebar ────────────────────────────────────────────────── */
function ConversationSidebar({ conversations, activeConvId, onSelect, onNew, onDelete }) {
  return (
    <div className="gaa-sidebar">
      <div className="gaa-sidebar-header">
        <span className="gaa-sidebar-title">المحادثات</span>
        <button className="gaa-sidebar-new-btn" onClick={onNew} title="محادثة جديدة">
          <PlusIcon className="icon-sm" />
        </button>
      </div>
      <div className="gaa-sidebar-list">
        {conversations.length === 0 && (
          <div className="gaa-sidebar-empty">لا توجد محادثات</div>
        )}
        {conversations.map(conv => (
          <div
            key={conv.id}
            role="button"
            tabIndex={0}
            className={`gaa-sidebar-item ${conv.id === activeConvId ? 'gaa-sidebar-item-active' : ''}`}
            onClick={() => onSelect(conv.id)}
            onKeyDown={e => e.key === 'Enter' && onSelect(conv.id)}
          >
            <div className="gaa-sidebar-item-content">
              <span className="gaa-sidebar-item-title">{conv.title}</span>
              <span className="gaa-sidebar-item-time">
                <ClockIcon className="icon-xs" />
                {formatConvDate(conv.updatedAt)}
              </span>
            </div>
            <button
              className="gaa-sidebar-item-del"
              onClick={e => onDelete(conv.id, e)}
              title="حذف"
            >
              <TrashIcon className="icon-xs" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Action Confirmation Banner ─────────────────────────────────────────── */
function ActionBanner({ action, onConfirm, onReject, products }) {
  const isBundle = action?.type === 'createBundle';
  return (
    <div className="gaa-action-banner">
      <div className="gaa-action-banner-info">
        <SparklesIcon className="icon-sm" />
        <span className="gaa-action-banner-label">{actionLabel(action)}</span>
        {isBundle && action.rationale && (
          <span className="gaa-action-banner-rationale">{action.rationale}</span>
        )}
      </div>
      {isBundle && action.productIds && products && (
        <div className="ai-bundle-products-preview">
          {action.productIds.map(pId => {
            const p = products.find(pr => String(pr.id) === String(pId));
            return p ? (
              <span key={pId} className="ai-bundle-product-chip">
                <PackageIcon className="icon-xs" /> {p.name}
              </span>
            ) : null;
          })}
        </div>
      )}
      <div className="gaa-action-banner-btns">
        <button className="gaa-action-btn gaa-action-btn-reject" onClick={onReject}>
          <XIcon className="icon-xs" /> رفض
        </button>
        <button className="gaa-action-btn gaa-action-btn-confirm" onClick={onConfirm}>
          <CheckCircleIcon className="icon-xs" /> {isBundle ? 'إدراج الحزمة' : 'تنفيذ'}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function GlobalAIAssistant({
  products,
  allProducts,
  suppliers,
  durations,
  bundles,
  coupons,
  tasks,
  appSettings,
  exchangeRate,
  pricingData,
  onNavigateToSettings,
  onCreateProduct,
  onCreateSupplier,
  onUpdateProduct,
  onCreateCoupon,
  onCreateBundle,
}) {
  /* ── UI state ── */
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [loadedSkills, setLoadedSkills] = useState(() => loadSkills());
  const [autoSkill, setAutoSkill] = useState(null);

  /* ── Conversation state ── */
  const [conversations, setConversations] = useState(() => {
    const loaded = loadChats();
    if (loaded.length === 0) {
      const first = makeEmptyConv();
      saveChats([first]);
      return [first];
    }
    return loaded;
  });
  const [activeConvId, setActiveConvId] = useState(() => {
    const loaded = loadChats();
    return loaded.length > 0 ? loaded[0].id : null;
  });

  /* ── Derived active conversation ── */
  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];
  const messages = activeConv?.messages || [];

  /* ── Input / AI state ── */
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSkill, setActiveSkill] = useState(null);
  const [showSkillsMenu, setShowSkillsMenu] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState('');

  /* ── Refs ── */
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const skillsMenuRef = useRef(null);
  const activeConvIdRef = useRef(activeConvId);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* ── Refresh skills on open ── */
  useEffect(() => {
    if (isOpen) {
      setLoadedSkills(loadSkills());
    }
  }, [isOpen]);

  /* ── Focus on open ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
      setHasUnread(false);
    }
  }, [isOpen]);

  /* ── Close panel on outside click ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowSkillsMenu(false);
        setShowSidebar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  /* ── Close skills menu on outside click ── */
  useEffect(() => {
    if (!showSkillsMenu) return;
    const handler = (e) => {
      if (skillsMenuRef.current && !skillsMenuRef.current.contains(e.target)) {
        setShowSkillsMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSkillsMenu]);

  /* ── Sync conversation helper ── */
  const syncConv = useCallback((msgs) => {
    const cid = activeConvIdRef.current;
    setConversations(prev => {
      const existing = prev.find(c => c.id === cid);
      if (!existing) return prev;
      const title = msgs.length > 0 ? makeConvTitle(msgs) : existing.title;
      const updated = prev.map(c =>
        c.id === cid ? { ...c, messages: msgs, title, updatedAt: Date.now() } : c
      );
      saveChats(updated);
      return updated;
    });
  }, []);

  /* ── Conversation management ── */
  const startNewConversation = useCallback(() => {
    const newConv = makeEmptyConv();
    setConversations(prev => {
      const updated = [newConv, ...prev];
      saveChats(updated);
      return updated;
    });
    setActiveConvId(newConv.id);
    activeConvIdRef.current = newConv.id;
    setPendingAction(null);
    setError('');
    setInput('');
    setShowSidebar(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const switchConversation = useCallback((convId) => {
    if (convId === activeConvId || isLoading) return;
    setActiveConvId(convId);
    activeConvIdRef.current = convId;
    setPendingAction(null);
    setError('');
    setInput('');
    setShowSidebar(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [activeConvId, isLoading]);

  const deleteConversation = useCallback((convId, e) => {
    e?.stopPropagation();
    setConversations(prev => {
      let updated = prev.filter(c => c.id !== convId);
      if (updated.length === 0) {
        updated = [makeEmptyConv()];
      }
      saveChats(updated);
      if (convId === activeConvIdRef.current) {
        setActiveConvId(updated[0].id);
        activeConvIdRef.current = updated[0].id;
        setPendingAction(null);
        setError('');
      }
      return updated;
    });
  }, []);

  /* ── API key check ── */
  const hasApiKey = Boolean(
    appSettings?.aiProvider === 'openrouter' ? appSettings?.openrouterApiKey :
    appSettings?.aiProvider === 'agentrouter' ? appSettings?.agentrouterApiKey :
    appSettings?.geminiApiKey
  );

  /* ── Build system prompt ── */
  const buildSystemPrompt = useCallback((skillOverride) => {
    const ctx = buildStoreContext({ products, allProducts, suppliers, durations, bundles, coupons, tasks, exchangeRate });
    const skill = skillOverride !== undefined ? skillOverride : activeSkill;
    const skillContent = skill?.content || skill?.prompt || '';
    const skillExtra = skillContent ? `\n\n${skillContent}` : '';
    return `${GLOBAL_SYSTEM_PROMPT}${skillExtra}\n\n${ctx}`;
  }, [products, allProducts, suppliers, durations, bundles, coupons, tasks, exchangeRate, activeSkill]);

  /* ── Execute confirmed action ── */
  const executeAction = useCallback((action, addMsgCallback) => {
    if (!action) return;
    try {
      switch (action.type) {
        case 'createProduct': {
          if (!action.name?.trim()) break;
          onCreateProduct?.(action.name.trim(), action.durationId || 'month_1', action.officialPriceUsd || 0);
          addMsgCallback?.(actionLabel(action));
          break;
        }
        case 'createSupplier': {
          if (!action.name?.trim()) break;
          onCreateSupplier?.({
            name: action.name.trim(),
            country: action.country || '',
            whatsapp: action.whatsapp || '',
            telegram: action.telegram || '',
          });
          addMsgCallback?.(actionLabel(action));
          break;
        }
        case 'addFeature': {
          const pid = Number(action.productId);
          const planId = Number(action.planId);
          const text = action.text?.trim();
          if (!pid || !planId || !text) break;
          onUpdateProduct?.(pid, (product) => ({
            ...product,
            plans: (product.plans || []).map(plan => {
              if (plan.id !== planId) return plan;
              const featureId = `feat_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
              return { ...plan, features: [...(plan.features || []), { id: featureId, text, isSeparator: false }] };
            }),
          }));
          addMsgCallback?.(actionLabel(action));
          break;
        }
        case 'updateDescription': {
          const pid = Number(action.productId);
          const desc = action.description?.trim();
          if (!pid || !desc) break;
          onUpdateProduct?.(pid, (product) => ({ ...product, description: desc }));
          addMsgCallback?.(actionLabel(action));
          break;
        }
        case 'updateDetails': {
          const pid = Number(action.productId);
          const det = action.details?.trim();
          if (!pid || !det) break;
          onUpdateProduct?.(pid, (product) => ({ ...product, details: det }));
          addMsgCallback?.(actionLabel(action));
          break;
        }
        case 'updateOfficialPrice': {
          const pid = Number(action.productId);
          const planId = Number(action.planId);
          const price = parseFloat(action.price);
          if (!pid || !planId || isNaN(price)) break;
          onUpdateProduct?.(pid, (product) => ({
            ...product,
            plans: (product.plans || []).map(plan =>
              plan.id === planId ? { ...plan, officialPriceUsd: price } : plan
            ),
          }));
          addMsgCallback?.(actionLabel(action));
          break;
        }
        case 'updatePlanPrice': {
          const pid = Number(action.productId);
          const planId = Number(action.planId);
          const supId = Number(action.supplierId);
          const price = parseFloat(action.price);
          if (!pid || !planId || !supId || isNaN(price)) break;
          onUpdateProduct?.(pid, (product) => ({
            ...product,
            plans: (product.plans || []).map(plan =>
              plan.id === planId
                ? { ...plan, prices: { ...plan.prices, [supId]: price } }
                : plan
            ),
          }));
          addMsgCallback?.(actionLabel(action));
          break;
        }
        case 'createCoupon': {
          if (!action.code?.trim()) break;
          onCreateCoupon?.({
            id: makeId(),
            code: action.code.trim().toUpperCase(),
            discountType: action.discountType || 'percent',
            value: parseFloat(action.value) || 0,
            minOrderAmount: parseFloat(action.minOrderAmount) || 0,
            isActive: true,
            createdAt: Date.now(),
          });
          addMsgCallback?.(actionLabel(action));
          break;
        }
        case 'createBundle': {
          if (!action.name?.trim() || !Array.isArray(action.productIds) || action.productIds.length < 2) break;
          const normalizedIds = [...new Set(
            action.productIds
              .map(aiId => products.find(p => String(p.id) === String(aiId))?.id)
              .filter(Boolean)
          )];
          if (normalizedIds.length < 2) break;
          const sortedKey = [...normalizedIds].map(String).sort().join(',');
          const isDuplicate = (bundles || []).some(b =>
            [...(b.productIds || [])].map(String).sort().join(',') === sortedKey
          );
          if (isDuplicate) break;
          const sellingPrice = parseFloat(action.sellingPrice) || 0;
          if (sellingPrice <= 0) break;
          const totalSupplierCost = normalizedIds.reduce((sum, pId) => {
            const prod = products.find(p => p.id === pId);
            if (!prod || !prod.plans || prod.plans.length === 0) return sum;
            const plan = prod.plans[0];
            const savedConfig = (pricingData || {})[prod.id] || {};
            const supplierId = savedConfig.primarySupplierId || suppliers[0]?.id;
            return sum + ((plan.prices?.[supplierId] || 0) * (exchangeRate || 1));
          }, 0);
          onCreateBundle?.({
            id: makeId(),
            name: action.name.trim(),
            productIds: normalizedIds,
            sellingPrice,
            totalSupplierCost,
            createdAt: Date.now(),
          });
          addMsgCallback?.(actionLabel(action));
          break;
        }
        default: break;
      }
    } catch (err) {
      console.error('GlobalAI action error:', err);
    }
  }, [onCreateProduct, onCreateSupplier, onUpdateProduct, onCreateCoupon, onCreateBundle, products, bundles, pricingData, suppliers, exchangeRate]);

  /* ── Send message ── */
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setError('');
    setPendingAction(null);
    setAutoSkill(null);

    const matched = activeSkill ? null : matchSkill(text, loadedSkills);
    if (matched) setAutoSkill(matched);

    const userMsg = { id: makeId(), role: 'user', content: text, timestamp: Date.now() };
    const nextMessages = [...messages, userMsg];
    syncConv(nextMessages);
    setInput('');
    setIsLoading(true);

    const apiMessages = nextMessages.map(m => ({ role: m.role, content: m.content }));
    const effectiveSkill = activeSkill || matched;

    try {
      const result = await callAI({
        systemPrompt: buildSystemPrompt(effectiveSkill),
        messages: apiMessages,
        appSettings,
      });

      const { clean, action } = parseActionFromText(result);

      const aiMsg = {
        id: makeId(),
        role: 'assistant',
        content: clean,
        timestamp: Date.now(),
      };

      if (action) {
        setPendingAction(action);
      }

      const finalMessages = [...nextMessages, aiMsg];
      syncConv(finalMessages);

      if (!isOpen) setHasUnread(true);
    } catch (e) {
      if (e.message === 'NO_KEY') {
        setError('no_key');
      } else {
        setError(`حدث خطأ: ${e.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Confirm pending action ── */
  const handleConfirmAction = () => {
    const action = pendingAction;
    setPendingAction(null);
    executeAction(action, (label) => {
      const systemMsg = {
        id: makeId(),
        role: 'assistant',
        content: `✅ تم تنفيذ: ${label}`,
        actionLabel: label,
        timestamp: Date.now(),
      };
      const cid = activeConvIdRef.current;
      setConversations(prev => {
        const conv = prev.find(c => c.id === cid);
        if (!conv) return prev;
        const updatedMsgs = [...conv.messages, systemMsg];
        const updated = prev.map(c =>
          c.id === cid ? { ...c, messages: updatedMsgs, updatedAt: Date.now() } : c
        );
        saveChats(updated);
        return updated;
      });
    });
  };

  const handleRejectAction = () => setPendingAction(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectSkill = (skill) => {
    setActiveSkill(prev => prev?.id === skill.id ? null : skill);
    setAutoSkill(null);
    setShowSkillsMenu(false);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const togglePanel = () => {
    setIsOpen(prev => !prev);
    setShowSkillsMenu(false);
    if (isOpen) setShowSidebar(false);
  };

  const currentConvMsgCount = messages.length;

  return (
    <div className="gaa-root" ref={panelRef}>

      {/* ══ Panel ══ */}
      <div className={`gaa-panel ${isOpen ? 'gaa-panel-open' : ''} ${showSidebar ? 'gaa-panel-with-sidebar' : ''}`} role="dialog" aria-label="المساعد الذكي">

        {/* ── Sidebar ── */}
        <div className={`gaa-sidebar-wrap ${showSidebar ? 'gaa-sidebar-visible' : ''}`}>
          <ConversationSidebar
            conversations={conversations}
            activeConvId={activeConvId}
            onSelect={switchConversation}
            onNew={startNewConversation}
            onDelete={deleteConversation}
          />
        </div>

        {/* ── Main area ── */}
        <div className="gaa-main">
          {/* Header */}
          <div className="gaa-panel-header">
            <div className="gaa-header-right">
              <button
                className={`gaa-icon-btn gaa-sidebar-toggle ${showSidebar ? 'gaa-sidebar-toggle-active' : ''}`}
                onClick={() => setShowSidebar(p => !p)}
                title={showSidebar ? 'إخفاء المحادثات' : 'عرض المحادثات'}
              >
                <ClockIcon className="icon-sm" />
              </button>
              <div className="gaa-header-info">
                <div className="gaa-header-title">
                  <SparklesIcon className="icon-sm" />
                  <span className="gaa-header-title-text">المساعد الذكي</span>
                </div>
                <div className={`gaa-status-dot ${hasApiKey ? 'gaa-status-online' : 'gaa-status-offline'}`}>
                  <span className="gaa-status-pulse" />
                  <span className="gaa-status-label">{hasApiKey ? 'متصل' : 'غير متصل'}</span>
                </div>
              </div>
            </div>
            <div className="gaa-header-actions">
              <button
                className="gaa-icon-btn"
                onClick={startNewConversation}
                title="محادثة جديدة"
              >
                <PlusIcon className="icon-sm" />
              </button>
              <button className="gaa-icon-btn" onClick={togglePanel} title="إغلاق">
                <XIcon className="icon-sm" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="gaa-messages">
            {currentConvMsgCount === 0 && !isLoading && (
              <div className="gaa-empty-state">
                <SparklesIcon className="icon-xl" />
                <p className="gaa-empty-title">مرحباً! أنا مساعدك الذكي</p>
                <p className="gaa-empty-sub">أعرف كل شيء عن منتجاتك وأسعارك وكوبوناتك. يمكنني الإجابة على أسئلتك وتنفيذ أوامر مباشرة على البيانات.</p>
              </div>
            )}
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {isLoading && <TypingDots />}

            {error === 'no_key' && (
              <div className="gaa-error-banner">
                <AlertTriangleIcon className="icon-sm" />
                <span>لم يتم تعيين مفتاح API.</span>
                {onNavigateToSettings && (
                  <button className="gaa-error-link" onClick={() => { onNavigateToSettings(); setIsOpen(false); }}>
                    <SettingsIcon className="icon-xs" /> الإعدادات
                  </button>
                )}
              </div>
            )}
            {error && error !== 'no_key' && (
              <div className="gaa-error-banner gaa-error-generic">
                <AlertTriangleIcon className="icon-sm" />
                <span>{error}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Active skill badge */}
          {(activeSkill || autoSkill) && (
            <div className="gaa-skill-badge-bar">
              {activeSkill ? (
                <SkillBadge skill={activeSkill} onRemove={() => setActiveSkill(null)} isAuto={false} />
              ) : (
                <SkillBadge skill={autoSkill} onRemove={() => setAutoSkill(null)} isAuto={true} />
              )}
            </div>
          )}

          {/* Pending action confirmation */}
          {pendingAction && (
            <ActionBanner
              action={pendingAction}
              onConfirm={handleConfirmAction}
              onReject={handleRejectAction}
              products={products}
            />
          )}

          {/* Input bar */}
          <div className="gaa-input-bar">
            <div className="gaa-input-wrap">
              <textarea
                ref={inputRef}
                className="gaa-textarea"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا..."
                rows={1}
                disabled={isLoading}
              />
              <div className="gaa-input-actions">
                {/* Skills button */}
                <div className="gaa-skills-wrap" ref={skillsMenuRef}>
                  <button
                    className={`gaa-skills-btn ${showSkillsMenu ? 'gaa-skills-btn-active' : ''} ${activeSkill ? 'gaa-skills-btn-has-skill' : ''}`}
                    onClick={() => setShowSkillsMenu(prev => !prev)}
                    title="المهارات"
                    style={activeSkill ? { color: activeSkill.color } : {}}
                  >
                    <ZapIcon className="icon-sm" />
                  </button>
                  {showSkillsMenu && (
                    <div className="gaa-skills-dropdown">
                      <div className="gaa-skills-header">اختر مهارة</div>
                      {loadedSkills.filter(s => s.enabled).map(skill => (
                        <button
                          key={skill.id}
                          className={`gaa-skill-item ${activeSkill?.id === skill.id ? 'gaa-skill-item-active' : ''}`}
                          onClick={() => selectSkill(skill)}
                          style={activeSkill?.id === skill.id ? { '--skill-color': skill.color || '#5E4FDE' } : {}}
                        >
                          <span className="gaa-skill-icon">{skill.icon || '⚡'}</span>
                          <span className="gaa-skill-name">{skill.name || skill.label}</span>
                          {activeSkill?.id === skill.id && <CheckCircleIcon className="icon-xs gaa-skill-check" />}
                        </button>
                      ))}
                      {loadedSkills.filter(s => s.enabled).length === 0 && (
                        <div className="gaa-skills-empty">لا توجد مهارات مفعّلة</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Send */}
                <button
                  className="gaa-send-btn"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  title="إرسال"
                >
                  <SendIcon className="icon-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ FAB ══ */}
      <div className="gaa-fab-wrap">
        <button
          className={`gaa-fab ${isOpen ? 'gaa-fab-open' : ''}`}
          onClick={togglePanel}
          aria-label="المساعد الذكي"
        >
          {isOpen ? <XIcon className="icon-md" /> : <SparklesIcon className="icon-md" />}
          {hasUnread && !isOpen && <span className="gaa-fab-unread" />}
        </button>
        {!isOpen && <div className="gaa-fab-tooltip">المساعد الذكي</div>}
      </div>
    </div>
  );
}
