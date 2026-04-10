import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  SettingsIcon, GlobeIcon, ClockIcon, PaletteIcon, 
  MoonIcon, SunIcon, DatabaseIcon, UploadIcon, 
  DownloadIcon, RefreshIcon, InfoIcon, XIcon, PlusIcon,
  AlertTriangleIcon, CheckCircleIcon, PackageIcon, ImageIcon,
  ExternalLinkIcon, SparklesIcon, KeyIcon, EyeIcon, ChevronDownIcon,
  ZapIcon, DownloadCloudIcon, LinkIcon,
} from './Icons';
import { GEMINI_MODELS, OPENROUTER_MODELS, AGENTROUTER_MODELS } from '../utils/aiProvider';
import SkillsTab from './SkillsTab';

function SettingsPage({
  exchangeRate,
  onRateChange,
  onResetData,
  onExportJson,
  onImportData,
  darkMode,
  onToggleDarkMode,
  durations,
  onAddDuration,
  onDeleteDuration,
  products,
  suppliers,
  bundles,
  customLogo,
  onLogoChange,
  appSettings,
  onAppSettingsChange,
}) {
  const [tempRate, setTempRate] = useState(exchangeRate);
  const [newDurationLabel, setNewDurationLabel] = useState('');
  const [newDurationMonths, setNewDurationMonths] = useState('');
  const [rateSaved, setRateSaved] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [showAgentrouterKey, setShowAgentrouterKey] = useState(false);
  const [settingsTab, setSettingsTab] = useState('store');
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const isElectron = typeof window !== 'undefined' && !!window.electronUpdater;
  const [updateStatus, setUpdateStatus] = useState({ state: 'idle' });
  const [appVersion, setAppVersion] = useState('');
  const [updateRepoUrl, setUpdateRepoUrl] = useState(() => {
    try { return localStorage.getItem('miftah_update_repo_url') || ''; } catch { return ''; }
  });
  const [repoUrlSaved, setRepoUrlSaved] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    window.electronUpdater.getVersion().then(v => { if (v) setAppVersion(v); });
    const cleanup = window.electronUpdater.onUpdateStatus(setUpdateStatus);
    return cleanup;
  }, [isElectron]);

  const handleSaveRepoUrl = useCallback(() => {
    try { localStorage.setItem('miftah_update_repo_url', updateRepoUrl.trim()); } catch {}
    setRepoUrlSaved(true);
    setTimeout(() => setRepoUrlSaved(false), 2000);
  }, [updateRepoUrl]);

  const handleCheckUpdate = useCallback(async () => {
    if (!isElectron) return;
    setUpdateStatus({ state: 'checking' });
    const repoUrl = updateRepoUrl.trim() || undefined;
    const result = await window.electronUpdater.checkForUpdates(repoUrl);
    if (result && !result.success) {
      setUpdateStatus({ state: 'error', message: result.reason || 'غير متاح في وضع التطوير' });
    }
  }, [isElectron, updateRepoUrl]);

  const handleDownloadUpdate = useCallback(async () => {
    if (!isElectron) return;
    const result = await window.electronUpdater.downloadUpdate();
    if (result && !result.success) {
      setUpdateStatus({ state: 'error', message: result.reason || 'فشل التحميل' });
    }
  }, [isElectron]);

  const handleInstallUpdate = useCallback(() => {
    if (!isElectron) return;
    window.electronUpdater.installUpdate();
  }, [isElectron]);

  const handleSaveRate = () => {
    const rate = parseFloat(tempRate);
    if (rate > 0) {
      onRateChange(rate);
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2000);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        onImportData(data);
        alert('تم استيراد البيانات بنجاح!');
      } catch {
        alert('خطأ: الملف غير صالح');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddDuration = () => {
    const label = newDurationLabel.trim();
    const months = parseInt(newDurationMonths);
    if (!label) { alert('الرجاء إدخال اسم المدة'); return; }
    if (!months || months <= 0) { alert('الرجاء إدخال عدد أشهر صحيح'); return; }
    onAddDuration(label, months);
    setNewDurationLabel('');
    setNewDurationMonths('');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('الرجاء اختيار ملف صورة (PNG, SVG, JPG)'); return; }
    if (file.size > 500 * 1024) { alert('حجم الصورة كبير جداً. الحد الأقصى 500 كيلوبايت'); return; }
    const reader = new FileReader();
    reader.onload = (event) => { onLogoChange(event.target.result); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateSetting = (key, value) => {
    onAppSettingsChange({ ...appSettings, [key]: value });
  };

  const totalPlans = (products || []).reduce((s, p) => s + (p.plans?.length || 0), 0);

  const accentOptions = [
    { id: 'purple', label: 'بنفسجي', color: '#5E4FDE' },
    { id: 'blue', label: 'أزرق', color: '#3B82F6' },
    { id: 'green', label: 'أخضر', color: '#10B981' },
    { id: 'red', label: 'أحمر', color: '#EF4444' },
    { id: 'orange', label: 'برتقالي', color: '#F97316' },
    { id: 'pink', label: 'وردي', color: '#EC4899' },
  ];

  const fontSizeOptions = [
    { id: 'small', label: 'صغير' },
    { id: 'medium', label: 'متوسط' },
    { id: 'large', label: 'كبير' },
  ];

  const borderOptions = [
    { id: 'sharp', label: 'حاد' },
    { id: 'rounded', label: 'مستدير' },
    { id: 'pill', label: 'كبسولة' },
  ];

  const TABS = [
    { id: 'store',      label: 'المتجر',            icon: <GlobeIcon className="icon-xs" /> },
    { id: 'appearance', label: 'المظهر',            icon: <PaletteIcon className="icon-xs" /> },
    { id: 'ai',         label: 'الذكاء الاصطناعي',  icon: <SparklesIcon className="icon-xs" /> },
    { id: 'skills',     label: 'المهارات',           icon: <ZapIcon className="icon-xs" /> },
    { id: 'data',       label: 'البيانات',           icon: <DatabaseIcon className="icon-xs" /> },
    { id: 'updates',    label: 'التحديثات',          icon: <DownloadCloudIcon className="icon-xs" /> },
  ];

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <div className="settings-page-header-icon">
          <SettingsIcon className="icon-xl" />
        </div>
        <div>
          <h2 className="settings-title">إعدادات البرنامج</h2>
          <p className="settings-subtitle">ضبط وتهيئة إعدادات المتجر والتفضيلات</p>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="settings-inner-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`settings-inner-tab ${settingsTab === tab.id ? 'settings-inner-tab-active' : ''}`}
            onClick={() => setSettingsTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          Tab: المتجر
          ══════════════════════════════════════════ */}
      {settingsTab === 'store' && (
        <>
          <div className="settings-stats-row">
            <div className="settings-stat-item">
              <PackageIcon className="icon-sm" />
              <span>{(products || []).length} منتج</span>
            </div>
            <div className="settings-stat-item">
              <GlobeIcon className="icon-sm" />
              <span>{(suppliers || []).length} مورد</span>
            </div>
            <div className="settings-stat-item">
              <ClockIcon className="icon-sm" />
              <span>{durations.length} مدة</span>
            </div>
            <div className="settings-stat-item">
              <DatabaseIcon className="icon-sm" />
              <span>{totalPlans} خطة</span>
            </div>
          </div>

          <div className="settings-grid settings-grid-3">
            {/* سعر الصرف */}
            <div className="settings-card">
              <div className="settings-card-icon-wrap settings-card-blue">
                <GlobeIcon className="icon-md" />
              </div>
              <h3>سعر الصرف</h3>
              <p className="settings-desc">تعيين سعر صرف الدولار مقابل الريال السعودي</p>
              <div className="settings-rate-row">
                <div className="settings-rate-group">
                  <span className="settings-rate-label">1 USD =</span>
                  <input
                    type="number"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    step="0.01"
                    min="0"
                    className="settings-input settings-rate-input"
                  />
                  <span className="settings-rate-label">SAR</span>
                </div>
                <button className={`settings-save-btn ${rateSaved ? 'saved' : ''}`} onClick={handleSaveRate}>
                  {rateSaved ? <><CheckCircleIcon className="icon-sm" /> تم الحفظ</> : 'حفظ'}
                </button>
              </div>
            </div>

            {/* رابط المتجر */}
            <div className="settings-card">
              <div className="settings-card-icon-wrap settings-card-teal">
                <GlobeIcon className="icon-md" />
              </div>
              <h3>رابط المتجر</h3>
              <p className="settings-desc">رابط متجرك الرقمي — يُستخدم كاختصار للوصول السريع من لوحة التحكم</p>
              <div className="settings-rate-row" style={{ flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="url"
                    value={appSettings?.storeUrl || ''}
                    onChange={e => updateSetting('storeUrl', e.target.value)}
                    placeholder="https://miftahdigital.store/"
                    className="settings-input"
                    style={{ flex: 1, direction: 'ltr', textAlign: 'left' }}
                    dir="ltr"
                  />
                  {appSettings?.storeUrl && (
                    <a
                      href={appSettings.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="settings-save-btn"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <ExternalLinkIcon className="icon-sm" /> فتح
                    </a>
                  )}
                </div>
                {appSettings?.storeUrl && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', direction: 'ltr', textAlign: 'left', margin: 0 }}>
                    {appSettings.storeUrl}
                  </p>
                )}
              </div>
            </div>

            {/* المناطق الزمنية */}
            <div className="settings-card">
              <div className="settings-card-icon-wrap settings-card-orange">
                <ClockIcon className="icon-md" />
              </div>
              <h3>المناطق الزمنية</h3>
              <p className="settings-desc">اختر المناطق الزمنية التي تظهر كساعات حية في لوحة التحكم</p>
              <div className="settings-tz-list">
                {(appSettings?.timezones || []).map((zone, idx) => (
                  <div key={zone.id} className="settings-tz-row">
                    <span className="settings-tz-flag">{zone.flag}</span>
                    <span className="settings-tz-label">{zone.label}</span>
                    <span className="settings-tz-code">{zone.tz}</span>
                    <button
                      className={`settings-tz-toggle ${zone.enabled !== false ? 'active' : ''}`}
                      onClick={() => {
                        const updated = (appSettings.timezones || []).map((z, i) =>
                          i === idx ? { ...z, enabled: z.enabled === false ? true : false } : z
                        );
                        updateSetting('timezones', updated);
                      }}
                    >
                      {zone.enabled !== false ? 'مفعّل' : 'مخفي'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* مدد الاشتراك */}
            <div className="settings-card settings-card-wide">
              <div className="settings-card-icon-wrap settings-card-green">
                <ClockIcon className="icon-md" />
              </div>
              <h3>مدد الاشتراك</h3>
              <p className="settings-desc">إدارة مدد الاشتراك المتاحة (شهري، سنوي، إلخ)</p>
              <div className="durations-list">
                {durations.map((dur) => (
                  <div key={dur.id} className="duration-chip">
                    <div className="duration-chip-info">
                      <span className="duration-chip-label">{dur.label}</span>
                      <span className="duration-chip-months">{dur.months} {dur.months === 1 ? 'شهر' : 'أشهر'}</span>
                    </div>
                    <button
                      className="duration-chip-delete"
                      onClick={() => {
                        if (confirm(`هل تريد حذف المدة "${dur.label}"؟`)) onDeleteDuration(dur.id);
                      }}
                      title="حذف المدة"
                    >
                      <XIcon className="icon-xs" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="add-duration-form">
                <input
                  type="text"
                  placeholder="اسم المدة (مثال: سنتين)"
                  value={newDurationLabel}
                  onChange={(e) => setNewDurationLabel(e.target.value)}
                  className="settings-input duration-input"
                />
                <input
                  type="number"
                  placeholder="عدد الأشهر"
                  value={newDurationMonths}
                  onChange={(e) => setNewDurationMonths(e.target.value)}
                  min="1"
                  className="settings-input duration-months-input"
                />
                <button className="btn-add-duration" onClick={handleAddDuration}>
                  <PlusIcon className="icon-sm" /> إضافة
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          Tab: المظهر
          ══════════════════════════════════════════ */}
      {settingsTab === 'appearance' && (
        <div className="settings-grid settings-grid-3">
          {/* المظهر - وضع داكن/فاتح */}
          <div className="settings-card">
            <div className="settings-card-icon-wrap settings-card-purple">
              <PaletteIcon className="icon-md" />
            </div>
            <h3>المظهر</h3>
            <p className="settings-desc">التبديل بين الوضع الداكن والفاتح</p>
            <div className="settings-theme-toggle" onClick={onToggleDarkMode}>
              <div className={`settings-theme-option ${darkMode ? 'active' : ''}`}>
                <MoonIcon className="icon-sm" /> الداكن
              </div>
              <div className={`settings-theme-option ${!darkMode ? 'active' : ''}`}>
                <SunIcon className="icon-sm" /> الفاتح
              </div>
            </div>
          </div>

          {/* حجم الخط */}
          <div className="settings-card">
            <div className="settings-card-icon-wrap settings-card-green">
              <SettingsIcon className="icon-md" />
            </div>
            <h3>حجم الخط</h3>
            <p className="settings-desc">تحكم في حجم نصوص البرنامج</p>
            <div className="settings-option-row">
              {fontSizeOptions.map(opt => (
                <button
                  key={opt.id}
                  className={`settings-option-btn ${appSettings.fontSize === opt.id ? 'active' : ''}`}
                  onClick={() => updateSetting('fontSize', opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* شكل الحواف */}
          <div className="settings-card">
            <div className="settings-card-icon-wrap settings-card-orange">
              <SettingsIcon className="icon-md" />
            </div>
            <h3>شكل الحواف</h3>
            <p className="settings-desc">تحكم في درجة استدارة زوايا العناصر</p>
            <div className="settings-option-row">
              {borderOptions.map(opt => (
                <button
                  key={opt.id}
                  className={`settings-option-btn ${appSettings.borderRadius === opt.id ? 'active' : ''}`}
                  onClick={() => updateSetting('borderRadius', opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* شعار البرنامج */}
          <div className="settings-card">
            <div className="settings-card-icon-wrap settings-card-indigo">
              <ImageIcon className="icon-md" />
            </div>
            <h3>شعار البرنامج</h3>
            <p className="settings-desc">ارفع شعاراً مخصصاً يظهر في رأس الصفحة (PNG أو SVG)</p>
            <div className="settings-logo-area">
              <div className="settings-logo-preview">
                {customLogo ? (
                  <img src={customLogo} alt="الشعار" className="settings-logo-img" />
                ) : (
                  <div className="settings-logo-placeholder">
                    <ImageIcon className="icon-md" />
                    <span>لا يوجد شعار</span>
                  </div>
                )}
              </div>
              <div className="settings-logo-actions">
                <button className="settings-logo-btn upload" onClick={() => logoInputRef.current?.click()}>
                  <UploadIcon className="icon-sm" /> رفع شعار
                </button>
                {customLogo && (
                  <button className="settings-logo-btn remove" onClick={() => onLogoChange(null)}>
                    <XIcon className="icon-sm" /> إزالة
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                style={{ display: 'none' }}
              />
              <p className="settings-logo-hint">الحد الأقصى: 500 كيلوبايت</p>
            </div>
          </div>

          {/* اللون الرئيسي */}
          <div className="settings-card settings-card-span2">
            <div className="settings-card-icon-wrap settings-card-accent">
              <PaletteIcon className="icon-md" />
            </div>
            <h3>اللون الرئيسي</h3>
            <p className="settings-desc">اختر اللون الرئيسي للبرنامج</p>
            <div className="settings-accent-grid">
              {accentOptions.map(opt => (
                <button
                  key={opt.id}
                  className={`settings-accent-btn ${appSettings.accentColor === opt.id ? 'active' : ''}`}
                  onClick={() => updateSetting('accentColor', opt.id)}
                  title={opt.label}
                >
                  <span className="accent-swatch" style={{ background: opt.color }}></span>
                  <span className="accent-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Tab: الذكاء الاصطناعي
          ══════════════════════════════════════════ */}
      {settingsTab === 'ai' && (
        <div className="settings-ai-wrapper">
          <div className="settings-card">
            <div className="settings-card-icon-wrap settings-card-purple">
              <SparklesIcon className="icon-md" />
            </div>
            <h3>إعدادات الذكاء الاصطناعي</h3>
            <p className="settings-desc">اختر مزود الذكاء الاصطناعي وأدخل مفتاح API لتفعيل مساعد توليد الأوصاف</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="settings-label">مزود الذكاء الاصطناعي</label>
                <div className="settings-option-row" style={{ marginTop: '8px' }}>
                  {[
                    { id: 'gemini',       label: 'Google Gemini' },
                    { id: 'openrouter',   label: 'OpenRouter' },
                    { id: 'agentrouter',  label: 'AgentRouter' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      className={`settings-option-btn ${appSettings?.aiProvider === opt.id ? 'active' : ''}`}
                      onClick={() => updateSetting('aiProvider', opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {appSettings?.aiProvider === 'gemini' && (
                <>
                  <div>
                    <label className="settings-label">
                      <KeyIcon className="icon-xs" style={{ marginLeft: '4px' }} />
                      مفتاح Gemini API
                    </label>
                    <div className="settings-api-key-row">
                      <input
                        type={showGeminiKey ? 'text' : 'password'}
                        className="settings-input"
                        style={{ flex: 1, direction: 'ltr', textAlign: 'left' }}
                        dir="ltr"
                        value={appSettings?.geminiApiKey || ''}
                        onChange={e => updateSetting('geminiApiKey', e.target.value)}
                        placeholder="AIzaSy..."
                      />
                      <button className="settings-key-toggle" onClick={() => setShowGeminiKey(v => !v)}>
                        <EyeIcon className="icon-xs" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="settings-label">نموذج Gemini</label>
                    <div className="settings-select-wrap" style={{ marginTop: '6px' }}>
                      <select
                        className="settings-input settings-select"
                        dir="ltr"
                        value={appSettings?.geminiModel || 'gemini-2.5-flash'}
                        onChange={e => updateSetting('geminiModel', e.target.value)}
                      >
                        {GEMINI_MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="settings-select-icon icon-xs" />
                    </div>
                  </div>
                </>
              )}

              {appSettings?.aiProvider === 'openrouter' && (
                <>
                  <div>
                    <label className="settings-label">
                      <KeyIcon className="icon-xs" style={{ marginLeft: '4px' }} />
                      مفتاح OpenRouter API
                    </label>
                    <div className="settings-api-key-row">
                      <input
                        type={showOpenrouterKey ? 'text' : 'password'}
                        className="settings-input"
                        style={{ flex: 1, direction: 'ltr', textAlign: 'left' }}
                        dir="ltr"
                        value={appSettings?.openrouterApiKey || ''}
                        onChange={e => updateSetting('openrouterApiKey', e.target.value)}
                        placeholder="sk-or-v1-..."
                      />
                      <button className="settings-key-toggle" onClick={() => setShowOpenrouterKey(v => !v)}>
                        <EyeIcon className="icon-xs" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="settings-label">نموذج OpenRouter</label>
                    <div className="settings-select-wrap" style={{ marginTop: '6px' }}>
                      <select
                        className="settings-input settings-select"
                        dir="ltr"
                        value={appSettings?.openrouterModel || 'anthropic/claude-sonnet-4.6'}
                        onChange={e => updateSetting('openrouterModel', e.target.value)}
                      >
                        {OPENROUTER_MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="settings-select-icon icon-xs" />
                    </div>
                  </div>
                </>
              )}

              {appSettings?.aiProvider === 'agentrouter' && (
                <>
                  <div className="ai-provider-info-banner">
                    <span>🤖</span>
                    <span>
                      AgentRouter بوابة موحدة مجانية تتيح الوصول لنماذج OpenAI وAnthropic وDeepSeek.
                      احصل على مفتاحك من{' '}
                      <a href="https://agentrouter.org/console/token" target="_blank" rel="noreferrer">
                        agentrouter.org
                      </a>
                    </span>
                  </div>
                  <div>
                    <label className="settings-label">
                      <KeyIcon className="icon-xs" style={{ marginLeft: '4px' }} />
                      مفتاح AgentRouter API
                    </label>
                    <div className="settings-api-key-row">
                      <input
                        type={showAgentrouterKey ? 'text' : 'password'}
                        className="settings-input"
                        style={{ flex: 1, direction: 'ltr', textAlign: 'left' }}
                        dir="ltr"
                        value={appSettings?.agentrouterApiKey || ''}
                        onChange={e => updateSetting('agentrouterApiKey', e.target.value)}
                        placeholder="sk-..."
                      />
                      <button className="settings-key-toggle" onClick={() => setShowAgentrouterKey(v => !v)}>
                        <EyeIcon className="icon-xs" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="settings-label">نموذج AgentRouter</label>
                    <div className="settings-select-wrap" style={{ marginTop: '6px' }}>
                      <select
                        className="settings-input settings-select"
                        dir="ltr"
                        value={appSettings?.agentrouterModel || 'gpt-4o'}
                        onChange={e => updateSetting('agentrouterModel', e.target.value)}
                      >
                        {AGENTROUTER_MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="settings-select-icon icon-xs" />
                    </div>
                  </div>
                </>
              )}

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                المفاتيح مُخزَّنة محلياً في متصفحك فقط ولا تُرسَل لأي خادم خارجي.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          Tab: المهارات
          ══════════════════════════════════════════ */}
      {settingsTab === 'skills' && (
        <div className="settings-skills-wrapper">
          <SkillsTab />
        </div>
      )}

      {/* ══════════════════════════════════════════
          Tab: البيانات
          ══════════════════════════════════════════ */}
      {settingsTab === 'data' && (
        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-card-icon-wrap settings-card-orange">
              <DatabaseIcon className="icon-md" />
            </div>
            <h3>إدارة البيانات</h3>
            <p className="settings-desc">تصدير واستيراد البيانات بصيغة JSON أو إعادة ضبط البيانات</p>
            <div className="settings-data-actions">
              <button className="settings-action-btn settings-action-export" onClick={onExportJson}>
                <UploadIcon className="icon-sm" />
                <div>
                  <span className="settings-action-title">تصدير البيانات</span>
                  <span className="settings-action-desc">حفظ نسخة احتياطية JSON</span>
                </div>
              </button>
              <button className="settings-action-btn settings-action-import" onClick={() => fileInputRef.current?.click()}>
                <DownloadIcon className="icon-sm" />
                <div>
                  <span className="settings-action-title">استيراد البيانات</span>
                  <span className="settings-action-desc">استعادة من ملف JSON</span>
                </div>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                style={{ display: 'none' }}
              />
              <button
                className="settings-action-btn settings-action-danger"
                onClick={() => {
                  if (confirm('هل أنت متأكد من إعادة ضبط جميع البيانات؟ سيتم حذف جميع التعديلات.')) {
                    onResetData();
                  }
                }}
              >
                <AlertTriangleIcon className="icon-sm" />
                <div>
                  <span className="settings-action-title">إعادة ضبط</span>
                  <span className="settings-action-desc">حذف جميع التعديلات</span>
                </div>
              </button>
            </div>
          </div>

          {/* إحصائيات البيانات */}
          <div className="settings-card">
            <div className="settings-card-icon-wrap settings-card-blue">
              <PackageIcon className="icon-md" />
            </div>
            <h3>إحصائيات البيانات</h3>
            <p className="settings-desc">ملخص سريع لما يحتويه النظام من بيانات</p>
            <div className="settings-data-stats">
              <div className="settings-data-stat-row">
                <PackageIcon className="icon-sm" />
                <span>المنتجات</span>
                <strong>{(products || []).length}</strong>
              </div>
              <div className="settings-data-stat-row">
                <GlobeIcon className="icon-sm" />
                <span>الموردون</span>
                <strong>{(suppliers || []).length}</strong>
              </div>
              <div className="settings-data-stat-row">
                <DatabaseIcon className="icon-sm" />
                <span>الخطط الإجمالية</span>
                <strong>{totalPlans}</strong>
              </div>
              <div className="settings-data-stat-row">
                <ClockIcon className="icon-sm" />
                <span>مدد الاشتراك</span>
                <strong>{durations.length}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {settingsTab === 'updates' && (
        <div className="settings-section">
          <div className="upd-hero">
            <div className="upd-hero-icon-wrap">
              <DownloadCloudIcon className="icon-lg" />
            </div>
            <div className="upd-hero-text">
              <h3>تحديثات البرنامج</h3>
              <p>إدارة التحديثات ومصدر التحميل</p>
            </div>
            <div className="upd-hero-version">
              <span>v{appVersion || '—'}</span>
            </div>
          </div>

          <div className="upd-grid">
            <div className="upd-panel upd-panel-main">
              <div className="upd-panel-header">
                <RefreshIcon className="icon-sm" />
                <span>حالة التحديث</span>
              </div>

              {!isElectron && (
                <div className="upd-info-banner">
                  <div className="upd-info-banner-icon"><InfoIcon className="icon-sm" /></div>
                  <div>
                    <strong>وضع المتصفح</strong>
                    <p>التحديث متاح فقط في نسخة سطح المكتب (Windows). في المتصفح، حدّث الصفحة للحصول على آخر التعديلات.</p>
                  </div>
                </div>
              )}

              {isElectron && (
                <div className="upd-state-area">
                  {updateStatus.state === 'idle' && (
                    <div className="upd-idle">
                      <div className="upd-idle-icon"><RefreshIcon /></div>
                      <p>اضغط للتحقق من وجود تحديثات جديدة</p>
                      <button className="btn btn-primary" onClick={handleCheckUpdate}>
                        <RefreshIcon className="icon-xs" />
                        <span>البحث عن تحديثات</span>
                      </button>
                    </div>
                  )}

                  {updateStatus.state === 'checking' && (
                    <div className="upd-checking">
                      <div className="upd-spinner-lg" />
                      <p>جاري البحث عن تحديثات...</p>
                    </div>
                  )}

                  {updateStatus.state === 'up-to-date' && (
                    <div className="upd-uptodate">
                      <div className="upd-success-icon"><CheckCircleIcon /></div>
                      <strong>البرنامج محدّث</strong>
                      <p>لديك أحدث إصدار متاح</p>
                      <button className="btn btn-sm btn-ghost" onClick={handleCheckUpdate}>
                        <RefreshIcon className="icon-xs" />
                        <span>فحص مجدداً</span>
                      </button>
                    </div>
                  )}

                  {updateStatus.state === 'available' && (
                    <div className="upd-available">
                      <div className="upd-available-badge">
                        <DownloadCloudIcon className="icon-sm" />
                        <span>تحديث جديد</span>
                      </div>
                      <div className="upd-available-ver">
                        الإصدار <strong>{updateStatus.version}</strong>
                      </div>
                      <div className="upd-warning-banner">
                        <AlertTriangleIcon className="icon-sm" />
                        <span>يُنصح بعمل نسخة احتياطية من بياناتك قبل التحديث</span>
                      </div>
                      <button className="btn btn-primary" onClick={handleDownloadUpdate}>
                        <DownloadIcon className="icon-xs" />
                        <span>تحميل التحديث</span>
                      </button>
                    </div>
                  )}

                  {updateStatus.state === 'downloading' && (
                    <div className="upd-downloading">
                      <div className="upd-dl-header">
                        <DownloadIcon className="icon-sm" />
                        <span>جاري التحميل</span>
                        <strong>{updateStatus.percent || 0}%</strong>
                      </div>
                      <div className="upd-progress-track">
                        <div className="upd-progress-bar" style={{ width: `${updateStatus.percent || 0}%` }} />
                      </div>
                    </div>
                  )}

                  {updateStatus.state === 'downloaded' && (
                    <div className="upd-downloaded">
                      <div className="upd-success-icon"><CheckCircleIcon /></div>
                      <strong>جاهز للتثبيت — v{updateStatus.version}</strong>
                      <div className="upd-warning-banner">
                        <AlertTriangleIcon className="icon-sm" />
                        <span>سيتم إغلاق البرنامج وإعادة تشغيله. تأكد من حفظ عملك.</span>
                      </div>
                      <button className="btn btn-primary upd-install-btn" onClick={handleInstallUpdate}>
                        <RefreshIcon className="icon-xs" />
                        <span>تثبيت وإعادة التشغيل</span>
                      </button>
                    </div>
                  )}

                  {updateStatus.state === 'error' && (
                    <div className="upd-error">
                      <div className="upd-error-icon"><AlertTriangleIcon /></div>
                      <strong>فشل التحديث</strong>
                      <p>{updateStatus.message}</p>
                      <button className="btn btn-sm btn-ghost" onClick={handleCheckUpdate}>
                        <RefreshIcon className="icon-xs" />
                        <span>إعادة المحاولة</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="upd-panel upd-panel-side">
              <div className="upd-panel-header">
                <LinkIcon className="icon-sm" />
                <span>مصدر التحديثات</span>
              </div>
              <div className="upd-repo-section">
                <label className="upd-repo-label">رابط مشروع GitHub</label>
                <div className="upd-repo-input-row">
                  <input
                    type="text"
                    className="input upd-repo-input"
                    placeholder="https://github.com/user/repo"
                    value={updateRepoUrl}
                    onChange={e => setUpdateRepoUrl(e.target.value)}
                    dir="ltr"
                  />
                  <button
                    className={`btn btn-sm ${repoUrlSaved ? 'upd-saved-btn' : 'btn-primary'}`}
                    onClick={handleSaveRepoUrl}
                  >
                    {repoUrlSaved ? <><CheckCircleIcon className="icon-xs" /><span>تم</span></> : <span>حفظ</span>}
                  </button>
                </div>
                <p className="upd-repo-hint">إذا تُرك فارغاً، سيتم استخدام المصدر الافتراضي المُعد في إعدادات البرنامج.</p>
              </div>

              <div className="upd-divider" />

              <div className="upd-steps-section">
                <div className="upd-panel-header">
                  <InfoIcon className="icon-sm" />
                  <span>كيف يعمل</span>
                </div>
                <div className="upd-steps">
                  <div className="upd-step"><div className="upd-step-dot">1</div><span>أدخل رابط GitHub أو استخدم الافتراضي</span></div>
                  <div className="upd-step"><div className="upd-step-dot">2</div><span>ابحث عن تحديثات متاحة</span></div>
                  <div className="upd-step"><div className="upd-step-dot">3</div><span>حمّل التحديث يدوياً بعد حفظ بياناتك</span></div>
                  <div className="upd-step"><div className="upd-step-dot">4</div><span>ثبّت وأعد التشغيل عندما تكون جاهزاً</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="settings-info-footer">
        <InfoIcon className="icon-sm" />
        <span>الإصدار {appVersion}</span>
        <span className="settings-info-sep">•</span>
        <span>الحفظ تلقائي (متصفح محلي)</span>
        <span className="settings-info-sep">•</span>
        <span>اللغة: العربية</span>
      </div>
    </div>
  );
}

export default SettingsPage;
