import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { callAI } from '../utils/aiProvider';
import { loadSkills } from '../data/builtinSkills';
import {
  SearchIcon, CopyIcon, CheckIcon, RefreshIcon, SaveIcon,
  SparklesIcon, ZapIcon, ChevronDownIcon, XIcon, GlobeIcon,
  PackageIcon, AlertTriangleIcon, CheckCircleIcon, LinkIcon,
  TargetIcon, FileTextIcon
} from './Icons';

const SEO_TAGS = ['seo', 'سيو', 'محركات البحث', 'عنوان', 'وصف', 'slug', 'ترتيب', 'جوجل'];

function findSEOSkills(skills) {
  return skills.filter(s => {
    if (!s.enabled) return false;
    const tags = (s.tags || []).map(t => t.toLowerCase());
    const cat = (s.category || '').toLowerCase();
    if (cat === 'seo') return true;
    return SEO_TAGS.some(st => tags.includes(st));
  });
}

function getSEOStatus(product) {
  const seo = product?.seo;
  if (!seo) return 'none';
  const { pageTitle, pageUrl, pageDescription } = seo;
  if (pageTitle && pageUrl && pageDescription) return 'complete';
  if (pageTitle || pageUrl || pageDescription) return 'partial';
  return 'none';
}

const STATUS_CONFIG = {
  complete: { label: 'مكتمل', className: 'seo-status-complete' },
  partial: { label: 'غير مكتمل', className: 'seo-status-partial' },
  none: { label: 'لم يُنشأ بعد', className: 'seo-status-none' },
};

const DEFAULT_SEO_PROMPT = `أنت خبير SEO متخصص في المتاجر الإلكترونية العربية على منصة سلة. مهمتك توليد محتوى SEO محسَّن لصفحات المنتجات الرقمية (اشتراكات، تراخيص برمجيات).

## القواعد:
1. **عنوان الصفحة (Page Title)**: 50-60 حرف كحد أقصى، يحتوي الكلمة المفتاحية الرئيسية، جذاب ومحفز للنقر.
2. **رابط الصفحة (SEO URL)**: slug لاتيني فقط، أحرف صغيرة، الكلمات مفصولة بـ "-"، بدون أحرف عربية أو خاصة.
3. **وصف الصفحة (Meta Description)**: 150-160 حرف كحد أقصى، يحتوي الكلمة المفتاحية، يحتوي CTA (دعوة للشراء)، وصفي وجذاب.

## تعليمات الإخراج:
أعد الإجابة بالتنسيق التالي بالضبط (JSON فقط بدون أي نص إضافي):
\`\`\`json
{
  "pageTitle": "العنوان هنا",
  "pageUrl": "the-slug-here",
  "pageDescription": "الوصف هنا"
}
\`\`\``;

function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u0600-\u06FF]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function CharCounter({ current, max }) {
  const ratio = current / max;
  let cls = 'seo-counter-ok';
  let label = 'ضمن الحد';
  if (ratio > 1) {
    cls = 'seo-counter-over';
    label = 'تجاوز الحد';
  } else if (ratio > 0.85) {
    cls = 'seo-counter-warn';
    label = 'قريب من الحد';
  }
  return (
    <div className={`seo-char-counter ${cls}`}>
      <div className="seo-counter-bar">
        <div className="seo-counter-fill" style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
      </div>
      <span className="seo-counter-text">{current.toLocaleString('en-US')} / {max.toLocaleString('en-US')}</span>
      <span className="seo-counter-label">{label}</span>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button className={`seo-copy-btn ${copied ? 'seo-copy-done' : ''}`} onClick={handleCopy} title={copied ? 'تم النسخ' : 'نسخ'} type="button">
      {copied ? <><CheckIcon className="icon-xs" /> تم النسخ</> : <><CopyIcon className="icon-xs" /> نسخ</>}
    </button>
  );
}

function GooglePreview({ title, url, description }) {
  const displayTitle = title || 'عنوان صفحة المنتج';
  const displayUrl = url ? `miftahdigital.store/${url}` : 'miftahdigital.store/product-name';
  const displayDesc = description || 'وصف صفحة المنتج يظهر هنا في نتائج محركات البحث...';
  return (
    <div className="seo-google-preview">
      <div className="seo-google-label">
        <SearchIcon className="icon-xs" />
        معاينة نتيجة البحث في Google
      </div>
      <div className="seo-google-card">
        <div className="seo-google-url">{displayUrl}</div>
        <div className="seo-google-title">{displayTitle}</div>
        <div className="seo-google-desc">{displayDesc}</div>
      </div>
    </div>
  );
}

function SEOAssistant({ products, updateProduct, appSettings, onNavigateToSettings, selectedProductId, onSelectProduct }) {
  const [productId, setProductId] = useState(selectedProductId || '');
  const [keywords, setKeywords] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [activeSkill, setActiveSkill] = useState(null);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  const allSkills = useMemo(() => loadSkills(), []);
  const seoSkills = useMemo(() => findSEOSkills(allSkills), [allSkills]);
  const product = useMemo(() => products.find(p => p.id === parseInt(productId)), [products, productId]);

  const seoStats = useMemo(() => {
    let complete = 0, partial = 0, none = 0;
    products.forEach(p => {
      const s = getSEOStatus(p);
      if (s === 'complete') complete++;
      else if (s === 'partial') partial++;
      else none++;
    });
    return { complete, partial, none, total: products.length };
  }, [products]);

  useEffect(() => {
    if (seoSkills.length > 0 && !activeSkill) setActiveSkill(seoSkills[0]);
  }, [seoSkills, activeSkill]);

  useEffect(() => {
    if (selectedProductId) setProductId(selectedProductId);
  }, [selectedProductId]);

  useEffect(() => {
    if (product?.seo) {
      setPageTitle(product.seo.pageTitle || '');
      setPageUrl(product.seo.pageUrl || '');
      setPageDescription(product.seo.pageDescription || '');
      setKeywords(product.seo.keywords || '');
      if (product.seo.skillUsed) {
        const skill = seoSkills.find(s => s.id === product.seo.skillUsed);
        if (skill) setActiveSkill(skill);
      }
    } else {
      setPageTitle('');
      setPageUrl('');
      setPageDescription('');
      setKeywords('');
    }
    setSaved(false);
    setError('');
  }, [product?.id]);

  const handleProductChange = useCallback((id) => {
    setProductId(id);
    if (onSelectProduct) onSelectProduct(id);
  }, [onSelectProduct]);

  const handleUrlChange = useCallback((val) => {
    setPageUrl(toSlug(val));
    setSaved(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!product) return;
    setGenerating(true);
    setError('');
    setSaved(false);
    try {
      let systemPrompt = DEFAULT_SEO_PROMPT;
      if (activeSkill?.content) systemPrompt = activeSkill.content + '\n\n' + DEFAULT_SEO_PROMPT;
      const productContext = `
اسم المنتج: ${product.name}
${product.description ? `وصف المنتج الحالي: ${product.description.replace(/<[^>]*>/g, '')}` : ''}
${product.plans?.length ? `الخطط المتاحة: ${product.plans.map(pl => pl.durationId).join(', ')}` : ''}
${product.activationMethods?.length ? `طرق التفعيل: ${product.activationMethods.join(', ')}` : ''}
${keywords ? `الكلمات المفتاحية المستهدفة: ${keywords}` : ''}`.trim();
      const messages = [{ role: 'user', content: productContext }];
      const response = await callAI({ systemPrompt, messages, appSettings });
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*"pageTitle"[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        if (parsed.pageTitle) setPageTitle(parsed.pageTitle);
        if (parsed.pageUrl) setPageUrl(toSlug(parsed.pageUrl));
        if (parsed.pageDescription) setPageDescription(parsed.pageDescription);
      } else {
        setError('لم يتمكن الذكاء الاصطناعي من إنشاء محتوى SEO بالتنسيق المطلوب. حاول مرة أخرى.');
      }
    } catch (err) {
      if (err.message === 'NO_KEY') setError('لم يتم تعيين مفتاح API. اذهب إلى الإعدادات لإضافة المفتاح.');
      else setError(err.message || 'حدث خطأ أثناء التوليد');
    } finally {
      setGenerating(false);
    }
  }, [product, keywords, activeSkill, appSettings]);

  const handleSave = useCallback(() => {
    if (!product) return;
    updateProduct(product.id, (p) => ({
      ...p,
      seo: { pageTitle, pageUrl, pageDescription, keywords, generatedAt: Date.now(), skillUsed: activeSkill?.id || null }
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [product, pageTitle, pageUrl, pageDescription, keywords, activeSkill, updateProduct]);

  if (!product) {
    return (
      <div className="seo-page">
        <div className="seo-hero">
          <div className="seo-hero-orb seo-hero-orb-1" />
          <div className="seo-hero-orb seo-hero-orb-2" />
          <div className="seo-hero-content">
            <div className="seo-hero-icon-wrap">
              <GlobeIcon className="icon-lg" />
            </div>
            <div className="seo-hero-text">
              <h2>تحسينات SEO</h2>
              <p>إنشاء وإدارة محتوى محركات البحث لمنتجاتك على سلة</p>
            </div>
          </div>
        </div>

        <div className="seo-stats-grid">
          <div className="seo-stat-card seo-stat-total">
            <div className="seo-stat-icon"><PackageIcon className="icon-md" /></div>
            <div className="seo-stat-info">
              <span className="seo-stat-value">{seoStats.total.toLocaleString('en-US')}</span>
              <span className="seo-stat-label">إجمالي المنتجات</span>
            </div>
          </div>
          <div className="seo-stat-card seo-stat-done">
            <div className="seo-stat-icon"><CheckCircleIcon className="icon-md" /></div>
            <div className="seo-stat-info">
              <span className="seo-stat-value">{seoStats.complete.toLocaleString('en-US')}</span>
              <span className="seo-stat-label">SEO مكتمل</span>
            </div>
          </div>
          <div className="seo-stat-card seo-stat-partial">
            <div className="seo-stat-icon"><AlertTriangleIcon className="icon-md" /></div>
            <div className="seo-stat-info">
              <span className="seo-stat-value">{seoStats.partial.toLocaleString('en-US')}</span>
              <span className="seo-stat-label">غير مكتمل</span>
            </div>
          </div>
          <div className="seo-stat-card seo-stat-empty">
            <div className="seo-stat-icon"><TargetIcon className="icon-md" /></div>
            <div className="seo-stat-info">
              <span className="seo-stat-value">{seoStats.none.toLocaleString('en-US')}</span>
              <span className="seo-stat-label">بحاجة لتحسين</span>
            </div>
          </div>
        </div>

        {seoStats.total > 0 && (
          <div className="seo-progress-wrap">
            <div className="seo-progress-header">
              <span>تقدم تحسين SEO</span>
              <span className="seo-progress-pct">{seoStats.total > 0 ? Math.round((seoStats.complete / seoStats.total) * 100).toLocaleString('en-US') : 0}%</span>
            </div>
            <div className="seo-progress-bar">
              <div className="seo-progress-fill seo-progress-complete" style={{ width: `${(seoStats.complete / seoStats.total) * 100}%` }} />
              <div className="seo-progress-fill seo-progress-partial-fill" style={{ width: `${(seoStats.partial / seoStats.total) * 100}%` }} />
            </div>
            <div className="seo-progress-legend">
              <span className="seo-legend-item"><span className="seo-legend-dot seo-dot-complete" /> مكتمل ({seoStats.complete.toLocaleString('en-US')})</span>
              <span className="seo-legend-item"><span className="seo-legend-dot seo-dot-partial" /> جزئي ({seoStats.partial.toLocaleString('en-US')})</span>
              <span className="seo-legend-item"><span className="seo-legend-dot seo-dot-none" /> بدون SEO ({seoStats.none.toLocaleString('en-US')})</span>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="unified-empty">
            <div className="unified-empty-icon"><PackageIcon className="icon-xl" /></div>
            <h4>لا توجد منتجات بعد</h4>
            <p>أضف منتجات من صفحة "المنتجات والأسعار" ثم عد هنا لتحسين SEO</p>
          </div>
        ) : (
          <div className="pf-products-grid">
            {products.map((p, i) => {
              const status = getSEOStatus(p);
              const cfg = STATUS_CONFIG[status];
              const cardColor = p.cardColor || null;
              const cardStyle = cardColor ? { '--card-accent': cardColor, borderInlineEnd: `3px solid ${cardColor}` } : {};
              return (
                <div key={p.id} className={`pf-product-card ${cardColor ? 'pf-product-card--colored' : ''}`} style={cardStyle} onClick={() => handleProductChange(String(p.id))}>
                  {cardColor && <div className="pf-product-card-color-bar" style={{ background: `linear-gradient(135deg, ${cardColor}22 0%, transparent 60%)` }} />}
                  <div className="pf-product-card-header">
                    <span className="pf-product-card-index">{i + 1}</span>
                    <h4 className="pf-product-card-name">{p.name}</h4>
                    <span className={`pf-product-card-badge ${cfg.className}`}>
                      {status === 'complete' ? <CheckCircleIcon className="icon-xs" /> : status === 'partial' ? <AlertTriangleIcon className="icon-xs" /> : null}
                      {' '}{cfg.label}
                    </span>
                  </div>
                  <div className="pf-product-card-meta">
                    {p.seo?.pageTitle && <span className="pf-product-card-chip"><FileTextIcon className="icon-xs" /> عنوان</span>}
                    {p.seo?.pageUrl && <span className="pf-product-card-chip"><LinkIcon className="icon-xs" /> رابط</span>}
                    {p.seo?.pageDescription && <span className="pf-product-card-chip"><SearchIcon className="icon-xs" /> وصف</span>}
                    {!p.seo?.pageTitle && !p.seo?.pageUrl && !p.seo?.pageDescription && (
                      <span className="pf-product-card-chip seo-chip-empty"><TargetIcon className="icon-xs" /> بحاجة لتحسين</span>
                    )}
                  </div>
                  {p.seo?.pageTitle && <div className="pf-product-card-preview">{p.seo.pageTitle}</div>}
                  <div className="pf-product-card-footer">
                    <button className="pf-product-card-btn pf-btn-seo" onClick={(e) => { e.stopPropagation(); handleProductChange(String(p.id)); }}>
                      <GlobeIcon className="icon-xs" /> فتح مساعد SEO
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="seo-assistant">
      <div className="seo-assistant-topbar">
        <button className="seo-back-btn" onClick={() => handleProductChange('')}>
          <ChevronDownIcon className="icon-xs" style={{ transform: 'rotate(90deg)' }} />
          العودة للقائمة
        </button>
        <div className="seo-product-badge">
          <PackageIcon className="icon-xs" />
          {product.name}
        </div>
        {getSEOStatus(product) === 'complete' && (
          <span className="seo-topbar-status seo-status-complete"><CheckCircleIcon className="icon-xs" /> مكتمل</span>
        )}
      </div>

      <div className="seo-two-col">
        <div className="seo-col-main">
          <div className="seo-card seo-card-generate">
            <div className="seo-card-header">
              <div className="seo-card-header-icon"><SparklesIcon className="icon-sm" /></div>
              <div>
                <h3>توليد محتوى SEO</h3>
                <p>أدخل الكلمات المفتاحية واضغط لتوليد المحتوى</p>
              </div>
            </div>

            <div className="seo-input-group">
              <label><TargetIcon className="icon-xs" /> الكلمات المفتاحية المستهدفة</label>
              <input
                type="text"
                className="seo-input"
                value={keywords}
                onChange={(e) => { setKeywords(e.target.value); setSaved(false); }}
                placeholder="مثال: اشتراك, شراء, رخيص, السعودية..."
                dir="rtl"
              />
            </div>

            <div className="seo-actions-row">
              <button className="seo-generate-btn" onClick={handleGenerate} disabled={generating || !product}>
                {generating ? (
                  <><RefreshIcon className="icon-sm seo-spin" /> جارِ التوليد...</>
                ) : (
                  <><SparklesIcon className="icon-sm" /> توليد بالذكاء الاصطناعي</>
                )}
              </button>

              <div className="seo-skill-badge-wrap">
                {activeSkill ? (
                  <button className="seo-skill-badge" onClick={() => setShowSkillPicker(!showSkillPicker)} title="المهارة النشطة">
                    <ZapIcon className="icon-xs" />
                    <span>{activeSkill.name}</span>
                    <ChevronDownIcon className="icon-xs" />
                  </button>
                ) : seoSkills.length > 0 ? (
                  <button className="seo-skill-badge seo-skill-badge-muted" onClick={() => setShowSkillPicker(!showSkillPicker)}>
                    <ZapIcon className="icon-xs" /> اختر مهارة <ChevronDownIcon className="icon-xs" />
                  </button>
                ) : (
                  <span className="seo-no-skill-hint">يعمل بالوضع الافتراضي</span>
                )}
                {showSkillPicker && (
                  <div className="seo-skill-dropdown">
                    <div className="seo-skill-dropdown-header">
                      <span>اختر مهارة SEO</span>
                      <button onClick={() => setShowSkillPicker(false)}><XIcon className="icon-xs" /></button>
                    </div>
                    {seoSkills.map(s => (
                      <button key={s.id} className={`seo-skill-option ${activeSkill?.id === s.id ? 'active' : ''}`} onClick={() => { setActiveSkill(s); setShowSkillPicker(false); }}>
                        <span className="seo-skill-option-icon">{s.icon}</span>
                        <div>
                          <div className="seo-skill-option-name">{s.name}</div>
                          <div className="seo-skill-option-desc">{s.description}</div>
                        </div>
                        {activeSkill?.id === s.id && <CheckIcon className="icon-xs" style={{ color: '#06B6D4' }} />}
                      </button>
                    ))}
                    <button className={`seo-skill-option ${!activeSkill ? 'active' : ''}`} onClick={() => { setActiveSkill(null); setShowSkillPicker(false); }}>
                      <span className="seo-skill-option-icon">📝</span>
                      <div>
                        <div className="seo-skill-option-name">بدون مهارة</div>
                        <div className="seo-skill-option-desc">System Prompt الافتراضي</div>
                      </div>
                      {!activeSkill && <CheckIcon className="icon-xs" style={{ color: '#06B6D4' }} />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="seo-error">
                <AlertTriangleIcon className="icon-sm" />
                <span>{error}</span>
                {error.includes('مفتاح API') && (
                  <button className="seo-error-link" onClick={onNavigateToSettings}>الذهاب للإعدادات</button>
                )}
              </div>
            )}
          </div>

          <div className="seo-card seo-card-fields">
            <div className="seo-card-header">
              <div className="seo-card-header-icon seo-icon-globe"><GlobeIcon className="icon-sm" /></div>
              <div>
                <h3>حقول SEO</h3>
                <p>مطابقة لحقول سلة — عدّل ثم انسخ إلى متجرك</p>
              </div>
            </div>

            <div className="seo-field">
              <div className="seo-field-header">
                <label><FileTextIcon className="icon-xs" /> عنوان صفحة المنتج <span className="seo-field-en">(Page Title)</span></label>
                <CopyButton text={pageTitle} />
              </div>
              <input type="text" className="seo-field-input" value={pageTitle} onChange={(e) => { setPageTitle(e.target.value); setSaved(false); }} placeholder="عنوان صفحة المنتج المحسَّن لمحركات البحث..." dir="rtl" />
              <CharCounter current={pageTitle.length} max={60} />
            </div>

            <div className="seo-field">
              <div className="seo-field-header">
                <label><LinkIcon className="icon-xs" /> رابط صفحة المنتج <span className="seo-field-en">(SEO Page URL)</span></label>
                <CopyButton text={pageUrl} />
              </div>
              <div className="seo-url-wrap">
                <span className="seo-url-prefix">miftahdigital.store/</span>
                <input type="text" className="seo-field-input seo-url-input" value={pageUrl} onChange={(e) => handleUrlChange(e.target.value)} placeholder="product-name-here" dir="ltr" />
              </div>
              <div className="seo-url-hint">slug لاتيني فقط — المسافات تتحول تلقائياً إلى "-"</div>
            </div>

            <div className="seo-field">
              <div className="seo-field-header">
                <label><SearchIcon className="icon-xs" /> وصف صفحة المنتج <span className="seo-field-en">(Page Description)</span></label>
                <CopyButton text={pageDescription} />
              </div>
              <textarea className="seo-field-input seo-field-textarea" value={pageDescription} onChange={(e) => { setPageDescription(e.target.value); setSaved(false); }} placeholder="وصف جذاب لصفحة المنتج يظهر في نتائج البحث..." rows={3} dir="rtl" />
              <CharCounter current={pageDescription.length} max={160} />
            </div>

            <div className="seo-save-row">
              <button className={`seo-save-btn ${saved ? 'seo-save-done' : ''}`} onClick={handleSave} disabled={!pageTitle && !pageUrl && !pageDescription}>
                {saved ? <><CheckCircleIcon className="icon-sm" /> تم الحفظ</> : <><SaveIcon className="icon-sm" /> حفظ</>}
              </button>
              <button className="seo-regenerate-btn" onClick={handleGenerate} disabled={generating || !product}>
                <RefreshIcon className="icon-sm" /> توليد من جديد
              </button>
            </div>
          </div>
        </div>

        <div className="seo-col-side">
          <GooglePreview title={pageTitle} url={pageUrl} description={pageDescription} />

          <div className="seo-card seo-card-product-switch">
            <div className="seo-card-header">
              <div className="seo-card-header-icon seo-icon-switch"><PackageIcon className="icon-sm" /></div>
              <div><h3>تبديل المنتج</h3></div>
            </div>
            <select value={productId} onChange={(e) => handleProductChange(e.target.value)} className="seo-select">
              <option value="">-- اختر منتج --</option>
              {products.map(p => {
                const st = getSEOStatus(p);
                const icon = st === 'complete' ? '✓' : st === 'partial' ? '⚠️' : '○';
                return <option key={p.id} value={p.id}>{icon} {p.name}</option>;
              })}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export { getSEOStatus };
export default SEOAssistant;
