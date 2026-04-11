import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  SettingsIcon, GlobeIcon, ClockIcon, PaletteIcon, 
  MoonIcon, SunIcon, DatabaseIcon, UploadIcon, 
  DownloadIcon, RefreshIcon, InfoIcon, XIcon, PlusIcon,
  AlertTriangleIcon, CheckCircleIcon, PackageIcon, ImageIcon,
  ExternalLinkIcon, SparklesIcon, KeyIcon, EyeIcon, ChevronDownIcon,
  ZapIcon, DownloadCloudIcon, LinkIcon, GitBranchIcon, CalendarIcon,
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

  const isValidGithubUrl = (url) => {
    if (!url) return null;
    return /^https:\/\/github\.com\/[^/]+\/[^/]/.test(url.trim());
  };

  const repoUrlValidState = updateRepoUrl.trim() === ''
    ? 'empty'
    : isValidGithubUrl(updateRepoUrl)
      ? 'valid'
      : 'invalid';

  const handleSaveRepoUrl = useCallback(() => {
    try { localStorage.setItem('miftah_update_repo_url', updateRepoUrl.trim()); } catch {}
    setRepoUrlSaved(true);
    setTimeout(() => setRepoUrlSaved(false), 2000);
  }, [updateRepoUrl]);

  const [scanResult, setScanResult] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  const handleCheckUpdate = useCallback(async () => {
    if (!isElectron) return;
    const repoUrl = updateRepoUrl.trim();
    if (!repoUrl) {
      setUpdateStatus({ state: 'error', message: 'أدخل رابط مستودع GitHub أولاً' });
      return;
    }
    setUpdateStatus({ state: 'checking' });
    setScanResult(null);
    try {
      const result = await window.electronUpdater.scanChanges(repoUrl);
      if (!result.success) {
        setUpdateStatus({ state: 'error', message: result.reason });
      } else if (result.totalChanges === 0) {
        setUpdateStatus({ state: 'up-to-date' });
        setScanResult(result);
      } else {
        setUpdateStatus({ state: 'changes-found' });
        setScanResult(result);
      }
    } catch (err) {
      setUpdateStatus({ state: 'error', message: err.message || 'خطأ غير معروف' });
    }
  }, [isElectron, updateRepoUrl]);

  const handleCreateBackup = useCallback(async () => {
    if (!isElectron) return;
    setUpdateStatus(prev => ({ ...prev, backupInProgress: true }));
    try {
      const result = await window.electronUpdater.createBackup();
      if (result.success) {
        setUpdateStatus(prev => ({ ...prev, backupInProgress: false, backupDone: true, backupPath: result.backupPath, backupCount: result.fileCount }));
      } else if (result.reason === 'canceled') {
        setUpdateStatus(prev => ({ ...prev, backupInProgress: false }));
      } else {
        setUpdateStatus(prev => ({ ...prev, backupInProgress: false, backupError: result.reason }));
      }
    } catch (err) {
      setUpdateStatus(prev => ({ ...prev, backupInProgress: false, backupError: err.message }));
    }
  }, [isElectron]);

  const handleApplyUpdate = useCallback(async () => {
    if (!isElectron || !scanResult) return;
    const totalFiles = (scanResult.modified?.length || 0) + (scanResult.added?.length || 0);
    setUpdateStatus({ state: 'downloading', current: 0, total: totalFiles, percent: 0 });
    try {
      const result = await window.electronUpdater.applyUpdate();
      if (result.success) {
        setUpdateStatus({ state: 'complete', downloaded: result.downloaded, failed: result.failed, errors: result.errors });
      } else {
        setUpdateStatus({ state: 'error', message: result.reason, errors: result.errors });
      }
    } catch (err) {
      setUpdateStatus({ state: 'error', message: err.message || 'فشل تطبيق التحديث' });
    }
  }, [isElectron, scanResult]);

  const handleRestartApp = useCallback(() => {
    if (!isElectron) return;
    window.electronUpdater.restartApp();
  }, [isElectron]);

  const toggleCategory = useCallback((cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

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
              <p>مزامنة الملفات مباشرة من GitHub</p>
            </div>
            <div className="upd-hero-version">
              <span>v{appVersion || '—'}</span>
            </div>
          </div>

          <div className="upd-panel upd-panel-side" style={{ marginBottom: '1rem' }}>
            <div className="upd-panel-header">
              <LinkIcon className="icon-sm" />
              <span>مستودع GitHub</span>
            </div>
            <div className="upd-repo-section">
              <div className="upd-repo-input-row">
                <div className={`upd-repo-input-wrapper upd-repo-input-wrapper--${repoUrlValidState}`}>
                  <LinkIcon className="upd-repo-prefix-icon icon-xs" />
                  <input
                    type="text"
                    className="input upd-repo-input"
                    placeholder="https://github.com/user/repo"
                    value={updateRepoUrl}
                    onChange={e => setUpdateRepoUrl(e.target.value)}
                    dir="ltr"
                  />
                  {updateRepoUrl && (
                    <button type="button" className="upd-repo-clear-btn" onClick={() => setUpdateRepoUrl('')} title="مسح">
                      <XIcon className="icon-xs" />
                    </button>
                  )}
                </div>
                <button
                  className={`btn btn-sm ${repoUrlSaved ? 'upd-saved-btn' : 'btn-primary'}`}
                  onClick={handleSaveRepoUrl}
                  disabled={repoUrlValidState === 'invalid'}
                >
                  {repoUrlSaved ? <><CheckCircleIcon className="icon-xs" /><span>تم</span></> : <span>حفظ</span>}
                </button>
              </div>
            </div>
          </div>

          <div className="upd-panel upd-panel-main">
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
                    <p>اضغط للبحث عن تحديثات في المستودع</p>
                    <button className="btn btn-primary" onClick={handleCheckUpdate} disabled={repoUrlValidState !== 'valid'}>
                      <RefreshIcon className="icon-xs" />
                      <span>البحث عن تحديثات</span>
                    </button>
                  </div>
                )}

                {updateStatus.state === 'checking' && (
                  <div className="upd-checking">
                    <div className="upd-spinner-lg" />
                    <p>جاري مقارنة الملفات مع المستودع...</p>
                  </div>
                )}

                {updateStatus.state === 'up-to-date' && (
                  <div className="upd-uptodate">
                    <div className="upd-success-icon"><CheckCircleIcon /></div>
                    <strong>جميع الملفات محدّثة</strong>
                    {scanResult?.latestCommit && (
                      <p className="upd-commit-info">
                        آخر commit: <span dir="ltr">{scanResult.latestCommit.sha}</span> — {scanResult.latestCommit.message}
                      </p>
                    )}
                    <button className="btn btn-sm btn-ghost" onClick={handleCheckUpdate}>
                      <RefreshIcon className="icon-xs" />
                      <span>فحص مجدداً</span>
                    </button>
                  </div>
                )}

                {updateStatus.state === 'changes-found' && scanResult && (
                  <div className="upd-changes-found">
                    <div className="upd-changes-summary">
                      <div className="upd-changes-count">
                        <DownloadCloudIcon className="icon-sm" />
                        <strong>{scanResult.totalChanges} ملف يحتاج تحديث</strong>
                      </div>
                      <div className="upd-changes-breakdown">
                        {scanResult.modified.length > 0 && (
                          <span className="upd-badge upd-badge--modified">{scanResult.modified.length} معدّل</span>
                        )}
                        {scanResult.added.length > 0 && (
                          <span className="upd-badge upd-badge--added">{scanResult.added.length} جديد</span>
                        )}
                      </div>
                    </div>

                    {scanResult.latestCommit && (
                      <div className="upd-commit-card">
                        <GitBranchIcon className="icon-xs" />
                        <span dir="ltr">{scanResult.latestCommit.sha}</span>
                        <span className="upd-commit-msg">{scanResult.latestCommit.message}</span>
                        <span className="upd-commit-date">{new Date(scanResult.latestCommit.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}

                    {scanResult.byCategory && Object.entries(scanResult.byCategory).map(([cat, info]) => (
                      <div key={cat} className="upd-file-category">
                        <button className="upd-cat-header" onClick={() => toggleCategory(cat)}>
                          <ChevronDownIcon className={`icon-xs upd-cat-chevron ${expandedCategories[cat] ? 'upd-cat-chevron--open' : ''}`} />
                          <span className="upd-cat-label">{info.label}</span>
                          <span className="upd-cat-count">{info.files.length}</span>
                        </button>
                        {expandedCategories[cat] && (
                          <div className="upd-file-list">
                            {info.files.map(f => (
                              <div key={f.path} className="upd-file-item">
                                <span className={`upd-file-status ${scanResult.modified.some(m => m.path === f.path) ? 'upd-file-status--modified' : 'upd-file-status--added'}`}>
                                  {scanResult.modified.some(m => m.path === f.path) ? 'معدّل' : 'جديد'}
                                </span>
                                <span className="upd-file-path" dir="ltr">{f.path}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="upd-action-area">
                      <div className="upd-action-buttons">
                        <button className="btn upd-btn upd-btn-apply" onClick={handleApplyUpdate}>
                          <DownloadCloudIcon className="icon-xs" />
                          <span>تطبيق التحديث</span>
                        </button>
                        <button
                          className="btn upd-btn upd-btn-backup"
                          onClick={handleCreateBackup}
                          disabled={updateStatus.backupInProgress}
                        >
                          {updateStatus.backupInProgress ? (
                            <><div className="upd-spinner-sm" /><span>جاري النسخ...</span></>
                          ) : updateStatus.backupDone ? (
                            <><CheckCircleIcon className="icon-xs" /><span>تم النسخ ({updateStatus.backupCount} ملف)</span></>
                          ) : (
                            <><DownloadIcon className="icon-xs" /><span>نسخة احتياطية أولاً</span></>
                          )}
                        </button>
                        <button className="btn upd-btn upd-btn-rescan" onClick={handleCheckUpdate}>
                          <RefreshIcon className="icon-xs" />
                          <span>إعادة الفحص</span>
                        </button>
                      </div>
                      {updateStatus.backupDone && updateStatus.backupPath && (
                        <span className="upd-backup-path" dir="ltr" title={updateStatus.backupPath}>
                          {updateStatus.backupPath.length > 50 ? '...' + updateStatus.backupPath.slice(-47) : updateStatus.backupPath}
                        </span>
                      )}
                      {updateStatus.backupError && (
                        <span className="upd-backup-error">{updateStatus.backupError}</span>
                      )}
                    </div>
                  </div>
                )}

                {updateStatus.state === 'downloading' && (
                  <div className="upd-downloading">
                    <div className="upd-dl-header">
                      <DownloadIcon className="icon-sm" />
                      <span>جاري تحميل الملفات</span>
                      <strong>{updateStatus.current || 0} / {updateStatus.total || 0}</strong>
                    </div>
                    <div className="upd-progress-track">
                      <div className="upd-progress-bar" style={{ width: `${updateStatus.percent || 0}%` }} />
                    </div>
                    {updateStatus.currentFile && (
                      <p className="upd-dl-current" dir="ltr">{updateStatus.currentFile}</p>
                    )}
                  </div>
                )}

                {updateStatus.state === 'applying' && (
                  <div className="upd-checking">
                    <div className="upd-spinner-lg" />
                    <p>جاري تطبيق التحديثات...</p>
                  </div>
                )}

                {updateStatus.state === 'complete' && (
                  <div className="upd-complete">
                    <div className="upd-success-icon"><CheckCircleIcon /></div>
                    <strong>تم التحديث بنجاح</strong>
                    <p>تم تحديث {updateStatus.downloaded} ملف{updateStatus.failed > 0 ? ` (فشل ${updateStatus.failed})` : ''}</p>
                    <div className="upd-warning-banner">
                      <AlertTriangleIcon className="icon-sm" />
                      <span>يجب إعادة تشغيل البرنامج لتطبيق التغييرات</span>
                    </div>
                    <div className="upd-complete-actions">
                      <button className="btn btn-primary" onClick={handleRestartApp}>
                        <RefreshIcon className="icon-xs" />
                        <span>إعادة التشغيل الآن</span>
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setUpdateStatus({ state: 'idle' })}>
                        <span>لاحقاً</span>
                      </button>
                    </div>
                  </div>
                )}

                {updateStatus.state === 'error' && (
                  <div className="upd-error">
                    <div className="upd-error-icon"><AlertTriangleIcon /></div>
                    <strong>حدث خطأ</strong>
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

          <div className="upd-panel upd-panel-side" style={{ marginTop: '1rem' }}>
            <div className="upd-panel-header">
              <InfoIcon className="icon-sm" />
              <span>كيف يعمل التحديث</span>
            </div>
            <div className="upd-steps">
              <div className="upd-step"><div className="upd-step-dot">1</div><span>أدخل رابط مستودع GitHub واحفظه</span></div>
              <div className="upd-step"><div className="upd-step-dot">2</div><span>اضغط "البحث عن تحديثات" لمقارنة الملفات</span></div>
              <div className="upd-step"><div className="upd-step-dot">3</div><span>اختياري: قم بعمل نسخة احتياطية قبل التحديث</span></div>
              <div className="upd-step"><div className="upd-step-dot">4</div><span>اضغط "تطبيق التحديث" — سيتم تحميل الملفات تلقائياً</span></div>
              <div className="upd-step"><div className="upd-step-dot">5</div><span>أعد تشغيل البرنامج لتفعيل التحديثات</span></div>
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
