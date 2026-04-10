import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  FileTextIcon, PackageIcon, SearchIcon, PlusIcon, TrashIcon,
  CheckCircleIcon, AlertTriangleIcon, CopyIcon,
  ArrowUpIcon, ArrowDownIcon, DownloadIcon, ListIcon,
  BoldIcon, ItalicIcon, MinusIcon,
  ChevronDownIcon, TagIcon, XIcon,
  UnderlineIcon, AlignRightIcon, AlignCenterIcon, AlignLeftIcon, AlignJustifyIcon, EraserIcon,
  UndoIcon, RedoIcon, SparklesIcon
} from './Icons';
import { FEATURE_ICONS, FEATURE_BADGES, PRODUCT_TEMPLATES } from '../data/productTemplates';
import AIAssistantTab from './AIAssistantTab';


function useClickOutside(ref, handler, excludeRef) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      if (excludeRef?.current && excludeRef.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler, excludeRef]);
}

function useFixedPosition(triggerRef, isOpen) {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!isOpen || !triggerRef?.current) return;
    const updatePos = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const showAbove = spaceBelow < 300 && spaceAbove > spaceBelow;
      setStyle({
        position: 'fixed',
        right: Math.max(8, window.innerWidth - rect.right),
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
        zIndex: 9999,
      });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isOpen, triggerRef]);

  return style;
}

function IconPicker({ currentIcon, onSelect, onClose, triggerRef }) {
  const ref = useRef(null);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef(null);
  const style = useFixedPosition(triggerRef, true);

  useClickOutside(ref, onClose, triggerRef);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }, []);

  const filtered = useMemo(() =>
    search.trim()
      ? FEATURE_ICONS.filter(ic => ic.label.includes(search) || ic.id.includes(search.toLowerCase()))
      : FEATURE_ICONS,
    [search]
  );

  return ReactDOM.createPortal(
    <div className="pf-icon-picker" ref={ref} style={style}>
      <div className="pf-icon-picker-header">
        <div className="pf-icon-search-wrap">
          <SearchIcon className="icon-xs" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="بحث عن أيقونة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pf-icon-search-input"
          />
          {search && (
            <button className="pf-icon-search-clear" onClick={() => setSearch('')}>
              <XIcon className="icon-xs" />
            </button>
          )}
        </div>
        <button className="pf-picker-close-btn" onClick={onClose} title="إغلاق">
          <XIcon className="icon-xs" />
        </button>
      </div>
      <div className="pf-icon-grid">
        {filtered.length === 0 ? (
          <div className="pf-icon-empty">لا نتائج</div>
        ) : (
          filtered.map(ic => (
            <button
              key={ic.id}
              className={`pf-icon-option ${currentIcon === ic.id ? 'active' : ''}`}
              onClick={() => onSelect(ic.id)}
              title={ic.label}
            >
              <span className="pf-icon-emoji">{ic.emoji}</span>
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

function BadgePicker({ currentBadge, onSelect, onClose, triggerRef }) {
  const ref = useRef(null);
  const style = useFixedPosition(triggerRef, true);

  useClickOutside(ref, onClose, triggerRef);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="pf-badge-picker" ref={ref} style={style}>
      <div className="pf-badge-picker-title">اختر وسماً</div>
      <button
        className={`pf-badge-option pf-badge-none ${!currentBadge ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        بدون وسم
      </button>
      <div className="pf-badge-divider" />
      {FEATURE_BADGES.map(b => (
        <button
          key={b.id}
          className={`pf-badge-option ${currentBadge === b.id ? 'active' : ''}`}
          style={{
            color: b.color,
            background: currentBadge === b.id ? `${b.color}18` : undefined,
            borderRight: currentBadge === b.id ? `3px solid ${b.color}` : '3px solid transparent',
          }}
          onClick={() => onSelect(b.id)}
        >
          {b.label}
        </button>
      ))}
    </div>,
    document.body
  );
}

function ProductFeatures({ products, setProducts, durations, suppliers, exchangeRate, activationMethods = [], appSettings, onAppSettingsChange, onNavigateToSettings, bundles, setBundles, costs, pricingData }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [featureSearch, setFeatureSearch] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(null);
  const [showBadgePicker, setShowBadgePicker] = useState(null);
  const [copyFromPlan, setCopyFromPlan] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState(new Set());
  const [activeSubTab, setActiveSubTab] = useState('editor');
  const featureInputRefs = useRef({});
  const iconBtnRefs = useRef({});
  const badgeBtnRefs = useRef({});

  const product = products.find(p => p.id === parseInt(selectedProductId));

  const updateProduct = useCallback((productId, updater) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return typeof updater === 'function' ? updater(p) : { ...p, ...updater };
    }));
  }, [setProducts]);

  // ── Inline editing states for product info card ──
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const urlInputRef = useRef(null);
  const [editingWarranty, setEditingWarranty] = useState(null); // { planId, supplierId }
  const [warrantyInput, setWarrantyInput] = useState('');
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const durationPickerRef = useRef(null);
  const methodPickerRef = useRef(null);

  useEffect(() => { if (editingUrl && urlInputRef.current) urlInputRef.current.focus(); }, [editingUrl]);
  useClickOutside(durationPickerRef, () => setShowDurationPicker(false));
  useClickOutside(methodPickerRef, () => setShowMethodPicker(false));

  // ── Handlers for product info inline editing ──
  const addPlanLocal = useCallback((durationId) => {
    if (!product) return;
    updateProduct(product.id, (p) => {
      const newPlanId = Math.max(0, ...p.plans.map(pl => pl.id)) + 1;
      const prices = {};
      suppliers.forEach(s => { prices[s.id] = 0; });
      return { ...p, plans: [...p.plans, { id: newPlanId, durationId, prices, supplierWarranty: {} }] };
    });
    setShowDurationPicker(false);
  }, [product, updateProduct, suppliers]);

  const deletePlanLocal = useCallback((planId) => {
    if (!product || product.plans.length <= 1) return;
    updateProduct(product.id, (p) => ({ ...p, plans: p.plans.filter(pl => pl.id !== planId) }));
  }, [product, updateProduct]);

  const toggleMethodLocal = useCallback((methodId) => {
    if (!product) return;
    updateProduct(product.id, (p) => {
      const current = p.activationMethods || [];
      return { ...p, activationMethods: current.includes(methodId) ? current.filter(m => m !== methodId) : [...current, methodId] };
    });
  }, [product, updateProduct]);

  const saveUrlLocal = useCallback(() => {
    if (!product) return;
    updateProduct(product.id, { storeUrl: urlInput.trim() });
    setEditingUrl(false);
  }, [product, updateProduct, urlInput]);

  const saveWarrantyLocal = useCallback((planId, supplierId, days) => {
    const d = Math.max(0, parseInt(days) || 0);
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(pl => pl.id === planId
        ? { ...pl, supplierWarranty: { ...(pl.supplierWarranty || {}), [supplierId]: d } }
        : pl
      ),
    }));
    setEditingWarranty(null);
  }, [product, updateProduct]);

  const editorRef = useRef(null);
  const [editorFormats, setEditorFormats] = useState({});
  const isFocusedRef = useRef(false);

  const MAX_HISTORY = 50;
  const historyRef = useRef([]);
  const historyIdxRef = useRef(-1);
  const debounceTimerRef = useRef(null);
  const [historyState, setHistoryState] = useState({ idx: -1, len: 0 });

  const handleDescriptionChange = useCallback((html) => {
    if (!product) return;
    updateProduct(product.id, { description: html });
  }, [product, updateProduct]);

  const pushHistory = useCallback((html) => {
    if (historyRef.current[historyIdxRef.current] === html) return;
    const next = historyRef.current.slice(0, historyIdxRef.current + 1);
    next.push(html);
    if (next.length > MAX_HISTORY) next.shift();
    historyRef.current = next;
    historyIdxRef.current = next.length - 1;
    setHistoryState({ idx: historyIdxRef.current, len: next.length });
  }, []);

  const debouncedPushHistory = useCallback((html) => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => pushHistory(html), 350);
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return;
    clearTimeout(debounceTimerRef.current);
    historyIdxRef.current -= 1;
    const html = historyRef.current[historyIdxRef.current];
    if (editorRef.current) editorRef.current.innerHTML = html;
    handleDescriptionChange(html);
    setHistoryState({ idx: historyIdxRef.current, len: historyRef.current.length });
  }, [handleDescriptionChange]);

  const redo = useCallback(() => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    clearTimeout(debounceTimerRef.current);
    historyIdxRef.current += 1;
    const html = historyRef.current[historyIdxRef.current];
    if (editorRef.current) editorRef.current.innerHTML = html;
    handleDescriptionChange(html);
    setHistoryState({ idx: historyIdxRef.current, len: historyRef.current.length });
  }, [handleDescriptionChange]);

  const canUndo = historyState.idx > 0;
  const canRedo = historyState.idx < historyState.len - 1;

  useEffect(() => {
    if (editorRef.current) {
      const html = product?.description || '';
      editorRef.current.innerHTML = html;
      historyRef.current = [html];
      historyIdxRef.current = 0;
      setHistoryState({ idx: 0, len: 1 });
      isFocusedRef.current = false;
    }
  }, [product?.id]);

  const updateFormats = useCallback(() => {
    try {
      setEditorFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyFull: document.queryCommandState('justifyFull'),
      });
    } catch (_) {}
  }, []);

  const applyFormat = useCallback((command, value = null) => {
    clearTimeout(debounceTimerRef.current);
    pushHistory(editorRef.current?.innerHTML || '');
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    const html = editorRef.current?.innerHTML || '';
    handleDescriptionChange(html);
    pushHistory(html);
    updateFormats();
  }, [handleDescriptionChange, updateFormats, pushHistory]);

  const applyFontSize = useCallback((px) => {
    clearTimeout(debounceTimerRef.current);
    pushHistory(editorRef.current?.innerHTML || '');
    editorRef.current?.focus();
    document.execCommand('fontSize', false, '7');
    const fontEls = editorRef.current?.querySelectorAll('font[size="7"]') || [];
    fontEls.forEach(font => {
      const span = document.createElement('span');
      span.style.fontSize = `${px}px`;
      span.innerHTML = font.innerHTML;
      font.parentNode.replaceChild(span, font);
    });
    const html = editorRef.current?.innerHTML || '';
    handleDescriptionChange(html);
    pushHistory(html);
  }, [handleDescriptionChange, pushHistory]);

  const applyColor = useCallback((hex) => {
    clearTimeout(debounceTimerRef.current);
    pushHistory(editorRef.current?.innerHTML || '');
    editorRef.current?.focus();
    document.execCommand('foreColor', false, hex);
    const html = editorRef.current?.innerHTML || '';
    handleDescriptionChange(html);
    pushHistory(html);
  }, [handleDescriptionChange, pushHistory]);

  const applyHeading = useCallback((tag) => {
    clearTimeout(debounceTimerRef.current);
    pushHistory(editorRef.current?.innerHTML || '');
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    const html = editorRef.current?.innerHTML || '';
    handleDescriptionChange(html);
    pushHistory(html);
    updateFormats();
  }, [handleDescriptionChange, updateFormats, pushHistory]);

  const clearAllFormat = useCallback(() => {
    clearTimeout(debounceTimerRef.current);
    pushHistory(editorRef.current?.innerHTML || '');
    editorRef.current?.focus();
    document.execCommand('removeFormat', false, null);
    document.execCommand('formatBlock', false, 'p');
    const html = editorRef.current?.innerHTML || '';
    handleDescriptionChange(html);
    pushHistory(html);
    updateFormats();
  }, [handleDescriptionChange, updateFormats, pushHistory]);

  const addFeature = useCallback((planId, focusNew = false) => {
    if (!product) return;
    const newId = `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        const features = plan.features || [];
        const maxOrder = features.reduce((max, f) => Math.max(max, f.order || 0), 0);
        return {
          ...plan,
          features: [...features, { text: '', icon: 'check', badge: null, order: maxOrder + 1, id: newId }]
        };
      })
    }));
    if (focusNew) {
      setTimeout(() => featureInputRefs.current[newId]?.focus(), 60);
    }
  }, [product, updateProduct]);

  const updateFeature = useCallback((planId, featureId, updates) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        return {
          ...plan,
          features: (plan.features || []).map(f => f.id === featureId ? { ...f, ...updates } : f)
        };
      })
    }));
  }, [product, updateProduct]);

  const toggleDesc = useCallback((featureId) => {
    setExpandedDesc(prev => {
      const next = new Set(prev);
      if (next.has(featureId)) next.delete(featureId); else next.add(featureId);
      return next;
    });
  }, []);

  const removeFeature = useCallback((planId, featureId) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        return { ...plan, features: (plan.features || []).filter(f => f.id !== featureId) };
      })
    }));
  }, [product, updateProduct]);

  const moveFeature = useCallback((planId, featureId, direction) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        const features = [...(plan.features || [])];
        const idx = features.findIndex(f => f.id === featureId);
        if (idx < 0) return plan;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= features.length) return plan;
        [features[idx], features[newIdx]] = [features[newIdx], features[idx]];
        return { ...plan, features: features.map((f, i) => ({ ...f, order: i + 1 })) };
      })
    }));
  }, [product, updateProduct]);

  const addSeparator = useCallback((planId) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      plans: p.plans.map(plan => {
        if (plan.id !== planId) return plan;
        const features = plan.features || [];
        return {
          ...plan,
          features: [...features, {
            text: '---', icon: 'none', badge: null, isSeparator: true,
            order: features.reduce((max, f) => Math.max(max, f.order || 0), 0) + 1,
            id: `sep_${Date.now()}`
          }]
        };
      })
    }));
  }, [product, updateProduct]);

  const copyFeatures = useCallback((fromPlanId, toPlanId) => {
    if (!product) return;
    updateProduct(product.id, (p) => {
      const fromPlan = p.plans.find(pl => pl.id === fromPlanId);
      if (!fromPlan?.features) return p;
      const existingCount = (p.plans.find(pl => pl.id === toPlanId)?.features || []).length;
      const copiedFeatures = fromPlan.features.map((f, i) => ({
        ...f, order: existingCount + i + 1,
        id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      }));
      return {
        ...p,
        plans: p.plans.map(plan => {
          if (plan.id !== toPlanId) return plan;
          return { ...plan, features: [...(plan.features || []), ...copiedFeatures] };
        })
      };
    });
    setCopyFromPlan(null);
  }, [product, updateProduct]);

  const loadTemplate = useCallback((template) => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      description: template.description,
      plans: p.plans.map((plan, idx) => ({
        ...plan,
        features: template.features.map((f, fi) => ({
          ...f, order: fi + 1,
          id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}_${idx}`
        }))
      }))
    }));
    setShowTemplates(false);
  }, [product, updateProduct]);

  const stats = useMemo(() => {
    let withDesc = 0, totalFeatures = 0;
    products.forEach(p => {
      if (p.description?.trim()) withDesc++;
      (p.plans || []).forEach(plan => {
        totalFeatures += (plan.features || []).filter(f => !f.isSeparator).length;
      });
    });
    return { withDesc, totalFeatures, total: products.length };
  }, [products]);

  const availableDurations = useMemo(() => {
    if (!product) return durations;
    const usedIds = new Set(product.plans.map(pl => pl.durationId));
    return durations.filter(d => !usedIds.has(d.id));
  }, [product, durations]);

  const availableMethods = useMemo(() => {
    if (!product) return activationMethods;
    const usedIds = new Set(product.activationMethods || []);
    return activationMethods.filter(m => !usedIds.has(m.id));
  }, [product, activationMethods]);

  const getProductStatus = (p) => {
    const hasDesc = p.description?.trim();
    const hasFeatures = p.plans?.some(plan => plan.features?.some(f => !f.isSeparator && f.text.trim()));
    return hasDesc && hasFeatures;
  };

  const getDurationLabel = (durationId) => {
    const d = durations.find(dur => dur.id === durationId);
    return d ? d.label : durationId;
  };

  const getIconEmoji = (iconId) => {
    const icon = FEATURE_ICONS.find(i => i.id === iconId);
    return icon ? icon.emoji : '✅';
  };

  const getBadgeInfo = (badgeId) => FEATURE_BADGES.find(b => b.id === badgeId);

  const closeAllPickers = () => {
    setShowIconPicker(null);
    setShowBadgePicker(null);
  };

  const handleFeatureKeyDown = (e, planId, featureId, features) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature(planId, true);
    } else if (e.key === 'Escape') {
      closeAllPickers();
      e.target.blur();
    } else if (e.key === 'Backspace' && e.target.value === '') {
      const idx = features.findIndex(f => f.id === featureId);
      removeFeature(planId, featureId);
      if (idx > 0) {
        const prevId = features[idx - 1]?.id;
        if (prevId) setTimeout(() => featureInputRefs.current[prevId]?.focus(), 30);
      }
    }
  };

  return (
    <div className="pf-container">
      <div className="pf-page-header">
        <div className="pf-header-content">
          <div className="pf-header-icon-wrap">
            <FileTextIcon className="icon-xl" />
          </div>
          <div>
            <h1 className="pf-page-title">وصف المنتجات والمزايا</h1>
            <p className="pf-page-subtitle">أضف أوصاف تفصيلية ومزايا لكل منتج وخططه لعرضها في التقارير والمتجر</p>
          </div>
        </div>
      </div>

      <div className="pf-stats-grid">
        <div className="pf-stat-card pf-stat-blue">
          <div className="pf-stat-icon"><PackageIcon className="icon-lg" /></div>
          <div className="pf-stat-data">
            <span className="pf-stat-value">{stats.total}</span>
            <span className="pf-stat-label">إجمالي المنتجات</span>
          </div>
        </div>
        <div className="pf-stat-card pf-stat-green">
          <div className="pf-stat-icon"><CheckCircleIcon className="icon-lg" /></div>
          <div className="pf-stat-data">
            <span className="pf-stat-value">{stats.withDesc}</span>
            <span className="pf-stat-label">منتجات لها أوصاف</span>
          </div>
        </div>
        <div className="pf-stat-card pf-stat-purple">
          <div className="pf-stat-icon"><ListIcon className="icon-lg" /></div>
          <div className="pf-stat-data">
            <span className="pf-stat-value">{stats.totalFeatures}</span>
            <span className="pf-stat-label">إجمالي المزايا</span>
          </div>
        </div>
      </div>

      <div className="pf-selector-card">
        <div className="pf-selector-icon"><PackageIcon className="icon-lg" /></div>
        <div className="pf-selector-content">
          <h3>اختر المنتج لتحرير الوصف والمزايا</h3>
          <p>حدد المنتج من القائمة ثم أضف الوصف والمزايا لكل خطة</p>
        </div>
        <select
          className="pf-product-select"
          value={selectedProductId}
          onChange={(e) => { setSelectedProductId(e.target.value); setFeatureSearch(''); closeAllPickers(); }}
        >
          <option value="">-- اختر منتج --</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {getProductStatus(p) ? '✓' : '⚠️'} {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-tab switcher */}
      <div className="pf-subtab-bar">
        <button
          className={`pf-subtab-btn ${activeSubTab === 'editor' ? 'pf-subtab-active' : ''}`}
          onClick={() => setActiveSubTab('editor')}
        >
          <FileTextIcon className="icon-xs" />
          محرر الوصف
        </button>
        <button
          className={`pf-subtab-btn ${activeSubTab === 'ai' ? 'pf-subtab-active' : ''}`}
          onClick={() => setActiveSubTab('ai')}
        >
          <SparklesIcon className="icon-xs" />
          مساعد الذكاء الاصطناعي
        </button>
      </div>

      {/* AI Assistant Tab */}
      {activeSubTab === 'ai' && (
        <AIAssistantTab
          product={product}
          products={products}
          suppliers={suppliers}
          durations={durations}
          activationMethods={activationMethods}
          appSettings={appSettings}
          onAppSettingsChange={onAppSettingsChange}
          updateProduct={updateProduct}
          onNavigateToSettings={onNavigateToSettings}
          onSelectProduct={setSelectedProductId}
          bundles={bundles}
          setBundles={setBundles}
          costs={costs}
          pricingData={pricingData}
          exchangeRate={exchangeRate}
        />
      )}

      {activeSubTab === 'editor' && !product && products.length === 0 ? (
        <div className="pf-empty-state">
          <div className="pf-empty-icon"><FileTextIcon className="icon-xl" /></div>
          <h3>لا توجد منتجات بعد</h3>
          <p>أضف منتجات من صفحة "المنتجات والأسعار" ثم عد هنا لإضافة الأوصاف والمزايا</p>
        </div>
      ) : activeSubTab === 'editor' && !product ? (
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
                onClick={() => setSelectedProductId(String(p.id))}
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
                  {(p.accountType && p.accountType !== 'none') && (
                    <span className="pf-product-card-chip">{p.accountType === 'individual' ? '👤 فردي' : '👥 فريق'}</span>
                  )}
                </div>
                {hasDesc && (
                  <div className="pf-product-card-preview">
                    {p.description.replace(/<[^>]*>/g, '').substring(0, 80)}...
                  </div>
                )}
                <div className="pf-product-card-footer">
                  <button className="pf-product-card-btn" onClick={(e) => { e.stopPropagation(); setSelectedProductId(String(p.id)); setActiveSubTab('editor'); }}>
                    <FileTextIcon className="icon-xs" /> تحرير الوصف
                  </button>
                  <button className="pf-product-card-btn pf-btn-ai" onClick={(e) => { e.stopPropagation(); setSelectedProductId(String(p.id)); setActiveSubTab('ai'); }}>
                    <SparklesIcon className="icon-xs" /> المساعد الذكي
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeSubTab === 'editor' ? (
        <div className="pf-editor-area">
          <div className="pf-editor-header">
            <div className="pf-editor-title-row">
              <h2>{product.name}</h2>
              {getProductStatus(product) ? (
                <span className="pf-status-complete"><CheckCircleIcon className="icon-sm" /> مكتمل</span>
              ) : (
                <span className="pf-status-incomplete"><AlertTriangleIcon className="icon-sm" /> ناقص</span>
              )}
            </div>
            <div className="pf-editor-actions">
              <button className="pf-template-btn" onClick={() => setShowTemplates(!showTemplates)}>
                <DownloadIcon className="icon-sm" />
                تحميل قالب جاهز
                <ChevronDownIcon className="icon-xs" style={{ transform: showTemplates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
          </div>

          {showTemplates && (
            <div className="pf-templates-panel">
              <h4>قوالب جاهزة للمنتجات الشائعة</h4>
              <p className="pf-templates-note">اختر قالباً لتحميل الوصف والمزايا تلقائياً (سيحل محل المحتوى الحالي)</p>
              <div className="pf-templates-grid">
                {PRODUCT_TEMPLATES.map(t => (
                  <button key={t.id} className="pf-template-item" onClick={() => loadTemplate(t)}>
                    <span className="pf-template-name">{t.name}</span>
                    <span className="pf-template-count">{t.features.length} ميزة</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pf-product-info-card">
            <div className="pf-product-info-header">
              <div className="pf-product-info-header-icon">
                <PackageIcon className="icon-xs" />
              </div>
              <span className="pf-product-info-header-title">معلومات المنتج</span>
            </div>
            <div className="pf-product-info-body">

              {/* ── مدد الاشتراك ── */}
              <div className="pf-product-info-row">
                <span className="pf-product-info-label">مدد الاشتراك</span>
                <div className="pf-product-info-value-cell">
                  {product.plans.map(plan => (
                    <span key={plan.id} className="pf-info-chip pf-info-chip--duration pf-info-chip--editable">
                      {getDurationLabel(plan.durationId)}
                      {product.plans.length > 1 && (
                        <button className="pf-chip-remove" onClick={() => deletePlanLocal(plan.id)} title="حذف هذه المدة">
                          <XIcon className="icon-xs" />
                        </button>
                      )}
                    </span>
                  ))}
                  <div className="pf-picker-wrap" ref={durationPickerRef}>
                    <button
                      className="pf-info-chip pf-info-chip--add"
                      onClick={() => setShowDurationPicker(v => !v)}
                      title="إضافة مدة اشتراك"
                    >
                      <PlusIcon className="icon-xs" /> مدة
                    </button>
                    {showDurationPicker && (
                      <div className="pf-picker-dropdown">
                        {availableDurations.length === 0
                          ? <div className="pf-picker-empty">كل المدد مضافة بالفعل</div>
                          : availableDurations.map(dur => (
                            <button key={dur.id} className="pf-picker-item" onClick={() => addPlanLocal(dur.id)}>
                              {getDurationLabel(dur.id)}
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── طرق التفعيل ── */}
              <div className="pf-product-info-row">
                <span className="pf-product-info-label">طرق التفعيل</span>
                <div className="pf-product-info-value-cell">
                  {(product.activationMethods || []).map(mId => {
                    const m = activationMethods.find(x => x.id === mId);
                    return m ? (
                      <span key={mId} className="pf-info-chip pf-info-chip--method pf-info-chip--editable" style={{ borderColor: m.color + '55', color: m.color, background: m.color + '14' }}>
                        {m.icon} {m.label}
                        <button className="pf-chip-remove" style={{ color: m.color }} onClick={() => toggleMethodLocal(mId)} title="إزالة">
                          <XIcon className="icon-xs" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  <div className="pf-picker-wrap" ref={methodPickerRef}>
                    <button
                      className="pf-info-chip pf-info-chip--add"
                      onClick={() => setShowMethodPicker(v => !v)}
                      title="إضافة طريقة تفعيل"
                    >
                      <PlusIcon className="icon-xs" /> طريقة
                    </button>
                    {showMethodPicker && (
                      <div className="pf-picker-dropdown">
                        {availableMethods.length === 0
                          ? <div className="pf-picker-empty">كل الطرق مضافة بالفعل</div>
                          : availableMethods.map(m => (
                            <button key={m.id} className="pf-picker-item" onClick={() => { toggleMethodLocal(m.id); setShowMethodPicker(false); }} style={{ color: m.color }}>
                              {m.icon} {m.label}
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── رابط المتجر ── */}
              <div className="pf-product-info-row">
                <span className="pf-product-info-label">رابط المتجر</span>
                <div className="pf-product-info-value-cell">
                  {editingUrl ? (
                    <div className="pf-url-edit-wrap">
                      <input
                        ref={urlInputRef}
                        className="pf-url-input"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveUrlLocal(); if (e.key === 'Escape') setEditingUrl(false); }}
                        placeholder="https://example.com/product"
                        dir="ltr"
                      />
                      <button className="pf-url-btn pf-url-btn--save" onClick={saveUrlLocal}>حفظ</button>
                      <button className="pf-url-btn pf-url-btn--cancel" onClick={() => setEditingUrl(false)}>إلغاء</button>
                    </div>
                  ) : (
                    <div className="pf-url-display" onClick={() => { setUrlInput(product.storeUrl || ''); setEditingUrl(true); }}>
                      {product.storeUrl ? (
                        <a href={product.storeUrl} target="_blank" rel="noopener noreferrer" className="pf-info-chip pf-info-chip--link" dir="ltr" onClick={e => e.stopPropagation()}>
                          🔗 {product.storeUrl}
                        </a>
                      ) : (
                        <span className="pf-info-empty pf-info-empty--clickable">+ إضافة رابط المتجر</span>
                      )}
                      <button className="pf-url-edit-btn" title="تعديل الرابط">✏️</button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── الضمان ── */}
              <div className="pf-product-info-row pf-product-info-row--warranty">
                <span className="pf-product-info-label">الضمان</span>
                <div className="pf-product-info-value-cell">
                  {product.plans.length > 0 ? (
                    <div className="pf-warranty-cards">
                      {suppliers.map(sup => (
                        <div key={sup.id} className="pf-wc-card">
                          <div className="pf-wc-sup">{sup.name}</div>
                          <div className="pf-wc-plans">
                            {product.plans.map(plan => {
                              const days = (plan.supplierWarranty || {})[sup.id] || 0;
                              const isEditing = editingWarranty?.planId === plan.id && editingWarranty?.supplierId === sup.id;
                              return (
                                <div
                                  key={plan.id}
                                  className={`pf-wc-plan-row${isEditing ? ' is-editing' : ''}`}
                                  onClick={() => { if (!isEditing) { setEditingWarranty({ planId: plan.id, supplierId: sup.id }); setWarrantyInput(days > 0 ? String(days) : ''); } }}
                                >
                                  <span className="pf-wc-dur">{getDurationLabel(plan.durationId)}</span>
                                  {isEditing ? (
                                    <div className="pf-warranty-edit-wrap" onClick={e => e.stopPropagation()}>
                                      <input
                                        className="pf-warranty-input"
                                        type="number"
                                        min="0"
                                        value={warrantyInput}
                                        autoFocus
                                        onChange={e => setWarrantyInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveWarrantyLocal(plan.id, sup.id, warrantyInput); if (e.key === 'Escape') setEditingWarranty(null); }}
                                      />
                                      <div className="pf-warranty-presets">
                                        {[{ label: 'شهر', days: 30 }, { label: '6 أشهر', days: 180 }, { label: 'سنة', days: 365 }].map(p => (
                                          <button key={p.days} className="pf-warranty-preset-btn" onClick={() => saveWarrantyLocal(plan.id, sup.id, p.days)}>{p.label}</button>
                                        ))}
                                        <button className="pf-warranty-preset-btn pf-warranty-preset-btn--clear" onClick={() => saveWarrantyLocal(plan.id, sup.id, 0)}>✕</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className={`pf-wc-days${days > 0 ? ' has-warranty' : ''}`}>{days > 0 ? `${days} ي` : '—'}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <span className="pf-info-empty">لا توجد خطط</span>}
                </div>
              </div>

            </div>
          </div>

          <div className="pf-desc-card">
            <div className="pf-desc-header">
              <span className="pf-desc-icon"><FileTextIcon className="icon-sm" /></span>
              <div>
                <h3>وصف المنتج</h3>
                <p>ظلّل النص ثم اختر التنسيق — بدون حد أقصى للنص</p>
              </div>
            </div>

            <div className="pf-toolbar pf-toolbar-rich">
              <div className="pf-toolbar-group">
                <button
                  className="pf-toolbar-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={undo}
                  disabled={!canUndo}
                  title={`تراجع (Ctrl+Z) — ${historyState.idx} خطوة`}
                  style={{ opacity: canUndo ? 1 : 0.35 }}
                >
                  <UndoIcon className="icon-sm" />
                </button>
                <button
                  className="pf-toolbar-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={redo}
                  disabled={!canRedo}
                  title={`إعادة (Ctrl+Shift+Z) — ${historyState.len - 1 - historyState.idx} خطوة`}
                  style={{ opacity: canRedo ? 1 : 0.35 }}
                >
                  <RedoIcon className="icon-sm" />
                </button>
                <span className="pf-history-counter" title="الخطوة الحالية / إجمالي الخطوات المحفوظة">
                  {historyState.idx}/{Math.min(historyState.len - 1, MAX_HISTORY - 1)}
                </span>
              </div>

              <div className="pf-toolbar-divider" />

              <div className="pf-toolbar-group pf-heading-group">
                {[
                  { label: 'عادي', tag: 'p', title: 'نص عادي' },
                  { label: 'H1', tag: 'h1', title: 'عنوان رئيسي' },
                  { label: 'H2', tag: 'h2', title: 'عنوان ثانوي' },
                  { label: 'H3', tag: 'h3', title: 'عنوان ثالثي' },
                  { label: 'H4', tag: 'h4', title: 'عنوان رابع' },
                ].map(h => (
                  <button
                    key={h.tag}
                    className="pf-heading-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHeading(h.tag)}
                    title={h.title}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              <div className="pf-toolbar-divider" />

              <div className="pf-toolbar-group">
                <button
                  className={`pf-toolbar-btn ${editorFormats.bold ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat('bold')}
                  title="تغميق (Ctrl+B)"
                >
                  <BoldIcon className="icon-sm" />
                </button>
                <button
                  className={`pf-toolbar-btn ${editorFormats.italic ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat('italic')}
                  title="مائل (Ctrl+I)"
                >
                  <ItalicIcon className="icon-sm" />
                </button>
                <button
                  className={`pf-toolbar-btn ${editorFormats.underline ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat('underline')}
                  title="تسطير (Ctrl+U)"
                >
                  <UnderlineIcon className="icon-sm" />
                </button>
              </div>

              <div className="pf-toolbar-divider" />

              <div className="pf-toolbar-group">
                <button
                  className={`pf-toolbar-btn ${editorFormats.justifyRight ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat('justifyRight')}
                  title="محاذاة يميناً"
                >
                  <AlignRightIcon className="icon-sm" />
                </button>
                <button
                  className={`pf-toolbar-btn ${editorFormats.justifyCenter ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat('justifyCenter')}
                  title="توسيط"
                >
                  <AlignCenterIcon className="icon-sm" />
                </button>
                <button
                  className={`pf-toolbar-btn ${editorFormats.justifyLeft ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat('justifyLeft')}
                  title="محاذاة يساراً"
                >
                  <AlignLeftIcon className="icon-sm" />
                </button>
                <button
                  className={`pf-toolbar-btn ${editorFormats.justifyFull ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyFormat('justifyFull')}
                  title="ضبط الأطراف"
                >
                  <AlignJustifyIcon className="icon-sm" />
                </button>
              </div>

              <div className="pf-toolbar-divider" />

              <div className="pf-toolbar-group pf-toolbar-size-group">
                <label className="pf-toolbar-label">حجم</label>
                <select
                  className="pf-toolbar-select"
                  defaultValue="14"
                  onChange={(e) => applyFontSize(Number(e.target.value))}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {[11,12,13,14,15,16,18,20,22,24,28,32,36,42,48].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="pf-toolbar-group">
                <label className="pf-toolbar-label">لون</label>
                <input
                  type="color"
                  defaultValue="#e2e8f0"
                  className="pf-color-picker"
                  title="لون النص المحدد"
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => applyColor(e.target.value)}
                />
              </div>

              <div className="pf-toolbar-divider" />

              <div className="pf-toolbar-group">
                <button
                  className="pf-toolbar-btn pf-clear-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearAllFormat}
                  title="مسح تنسيق النص المحدد"
                >
                  <EraserIcon className="icon-sm" />
                </button>
              </div>
            </div>

            <div
              ref={editorRef}
              className="pf-desc-editor"
              contentEditable
              suppressContentEditableWarning
              dir="rtl"
              onFocus={() => { isFocusedRef.current = true; updateFormats(); }}
              onBlur={() => {
                isFocusedRef.current = false;
                const html = editorRef.current?.innerHTML || '';
                handleDescriptionChange(html);
                pushHistory(html);
              }}
              onInput={() => {
                const html = editorRef.current?.innerHTML || '';
                handleDescriptionChange(html);
                debouncedPushHistory(html);
              }}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    undo();
                  } else if (e.key === 'z' && e.shiftKey) {
                    e.preventDefault();
                    redo();
                  } else if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                  }
                }
              }}
              onKeyUp={updateFormats}
              onMouseUp={updateFormats}
              data-placeholder="ظلّل النص ثم اختر تنسيقه... اكتب وصفاً تفصيلياً للمنتج بدون حد للنص."
            />

            <div className="pf-char-counter">
              <span className="pf-word-count">
                {(() => {
                  const txt = (editorRef.current?.innerText || product?.description?.replace(/<[^>]*>/g,'') || '').trim();
                  return txt ? txt.split(/\s+/).length : 0;
                })()} كلمة
              </span>
              <span className="pf-char-count">
                {(editorRef.current?.innerText || product?.description?.replace(/<[^>]*>/g,'') || '').length} حرف
              </span>
            </div>
          </div>

          {(product.plans.length > 1 || product.plans.some(pl => (pl.features || []).length > 5)) && (
            <div className="pf-search-bar">
              <SearchIcon className="icon-sm" />
              <input
                type="text"
                placeholder="بحث في المزايا..."
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
              />
              {featureSearch && (
                <button className="pf-search-clear" onClick={() => setFeatureSearch('')} title="مسح البحث">
                  <XIcon className="icon-xs" />
                </button>
              )}
            </div>
          )}

          <div className="pf-plans-grid">
            {product.plans.map((plan) => {
              const features = plan.features || [];
              const filteredFeatures = featureSearch
                ? features.filter(f => f.isSeparator || f.text.toLowerCase().includes(featureSearch.toLowerCase()))
                : features;
              const prices = Object.values(plan.prices || {}).filter(v => v > 0);
              const bestPrice = prices.length ? Math.min(...prices.map(v => v * exchangeRate)) : 0;

              return (
                <div key={plan.id} className="pf-plan-card">
                  <div className="pf-plan-header">
                    <div className="pf-plan-info">
                      <h3 className="pf-plan-name">{getDurationLabel(plan.durationId)}</h3>
                      {bestPrice > 0 && (
                        <span className="pf-plan-price">{Number(bestPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س</span>
                      )}
                    </div>
                    <div className="pf-plan-actions">
                      <span className="pf-features-count">{features.filter(f => !f.isSeparator).length} ميزة</span>
                      <div className="pf-plan-btns">
                        <button className="pf-plan-action-btn" onClick={() => setCopyFromPlan(copyFromPlan === plan.id ? null : plan.id)} title="نسخ المزايا">
                          <CopyIcon className="icon-sm" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {copyFromPlan === plan.id && product.plans.length > 1 && (
                    <div className="pf-copy-panel">
                      <span>نسخ مزايا هذه الخطة إلى:</span>
                      <div className="pf-copy-targets">
                        {product.plans.filter(pl => pl.id !== plan.id).map(pl => (
                          <button key={pl.id} className="pf-copy-target-btn" onClick={() => copyFeatures(plan.id, pl.id)}>
                            {getDurationLabel(pl.durationId)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pf-features-list">
                    {filteredFeatures.length === 0 && !featureSearch && (
                      <div className="pf-features-empty">
                        <span>لا توجد مزايا بعد</span>
                        <button className="pf-features-empty-btn" onClick={() => addFeature(plan.id, true)}>
                          <PlusIcon className="icon-xs" /> أضف أول ميزة
                        </button>
                      </div>
                    )}
                    {filteredFeatures.map((feature, idx) => {
                      if (feature.isSeparator) {
                        return (
                          <div key={feature.id} className="pf-separator-row">
                            <div className="pf-separator-line" />
                            <button className="pf-remove-btn" onClick={() => removeFeature(plan.id, feature.id)} title="حذف الفاصل">
                              <TrashIcon className="icon-xs" />
                            </button>
                          </div>
                        );
                      }
                      const badgeInfo = feature.badge ? getBadgeInfo(feature.badge) : null;
                      const isIconOpen = showIconPicker === feature.id;
                      const isBadgeOpen = showBadgePicker === feature.id;
                      const isDescExpanded = expandedDesc.has(feature.id);

                      return (
                        <div key={feature.id} className="pf-feature-item">
                        <div className={`pf-feature-row ${isIconOpen || isBadgeOpen ? 'pf-feature-row--active' : ''}`}>
                          <div className="pf-feature-icon-wrap">
                            <button
                              ref={el => iconBtnRefs.current[feature.id] = el}
                              className={`pf-feature-icon-btn ${isIconOpen ? 'open' : ''}`}
                              onClick={() => {
                                setShowBadgePicker(null);
                                setShowIconPicker(isIconOpen ? null : feature.id);
                              }}
                              title="تغيير الأيقونة"
                              type="button"
                            >
                              {getIconEmoji(feature.icon)}
                            </button>
                            {isIconOpen && (
                              <IconPicker
                                currentIcon={feature.icon}
                                triggerRef={{ current: iconBtnRefs.current[feature.id] }}
                                onSelect={(iconId) => {
                                  updateFeature(plan.id, feature.id, { icon: iconId });
                                  setShowIconPicker(null);
                                  featureInputRefs.current[feature.id]?.focus();
                                }}
                                onClose={() => setShowIconPicker(null)}
                              />
                            )}
                          </div>

                          <input
                            ref={el => featureInputRefs.current[feature.id] = el}
                            type="text"
                            className="pf-feature-input"
                            value={feature.text}
                            onChange={(e) => updateFeature(plan.id, feature.id, { text: e.target.value })}
                            onKeyDown={(e) => handleFeatureKeyDown(e, plan.id, feature.id, features)}
                            placeholder="اكتب الميزة... (Enter لإضافة أخرى)"
                          />

                          <div className="pf-feature-badge-wrap">
                            <button
                              ref={el => badgeBtnRefs.current[feature.id] = el}
                              className={`pf-badge-btn ${isBadgeOpen ? 'open' : ''} ${badgeInfo ? 'has-badge' : ''}`}
                              onClick={() => {
                                setShowIconPicker(null);
                                setShowBadgePicker(isBadgeOpen ? null : feature.id);
                              }}
                              style={badgeInfo ? {
                                background: `${badgeInfo.color}18`,
                                color: badgeInfo.color,
                                borderColor: `${badgeInfo.color}50`,
                              } : {}}
                              title="إضافة وسم"
                              type="button"
                            >
                              {badgeInfo ? badgeInfo.label : <TagIcon className="icon-xs" />}
                            </button>
                            {isBadgeOpen && (
                              <BadgePicker
                                currentBadge={feature.badge}
                                triggerRef={{ current: badgeBtnRefs.current[feature.id] }}
                                onSelect={(badgeId) => {
                                  updateFeature(plan.id, feature.id, { badge: badgeId });
                                  setShowBadgePicker(null);
                                  featureInputRefs.current[feature.id]?.focus();
                                }}
                                onClose={() => setShowBadgePicker(null)}
                              />
                            )}
                          </div>

                          <div className="pf-feature-controls">
                            <button className="pf-move-btn" onClick={() => moveFeature(plan.id, feature.id, 'up')} disabled={idx === 0} title="نقل لأعلى">
                              <ArrowUpIcon className="icon-xs" />
                            </button>
                            <button className="pf-move-btn" onClick={() => moveFeature(plan.id, feature.id, 'down')} disabled={idx === filteredFeatures.length - 1} title="نقل لأسفل">
                              <ArrowDownIcon className="icon-xs" />
                            </button>
                            <button
                              className={`pf-move-btn pf-desc-toggle-btn ${isDescExpanded ? 'active' : ''} ${feature.desc ? 'has-desc' : ''}`}
                              onClick={() => toggleDesc(feature.id)}
                              title={isDescExpanded ? 'إخفاء الوصف' : 'إضافة وصف للميزة'}
                              type="button"
                            >
                              <AlignLeftIcon className="icon-xs" />
                            </button>
                            <button className="pf-remove-btn" onClick={() => removeFeature(plan.id, feature.id)} title="حذف">
                              <TrashIcon className="icon-xs" />
                            </button>
                          </div>
                        </div>
                        {isDescExpanded && (
                          <div className="pf-feature-desc-area">
                            <textarea
                              className="pf-feature-desc-input"
                              value={feature.desc || ''}
                              onChange={(e) => updateFeature(plan.id, feature.id, { desc: e.target.value })}
                              placeholder="أضف وصفاً تفصيلياً لهذه الميزة..."
                              rows={2}
                              autoFocus
                            />
                          </div>
                        )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pf-plan-footer">
                    <button className="pf-add-feature-btn" onClick={() => addFeature(plan.id, true)}>
                      <PlusIcon className="icon-sm" />
                      إضافة ميزة
                    </button>
                    <button className="pf-add-separator-btn" onClick={() => addSeparator(plan.id)}>
                      <MinusIcon className="icon-sm" />
                      فاصل
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProductFeatures;
