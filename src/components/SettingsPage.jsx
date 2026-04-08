import { useState, useRef } from 'react';
import { 
  SettingsIcon, GlobeIcon, ClockIcon, PaletteIcon, 
  MoonIcon, SunIcon, DatabaseIcon, UploadIcon, 
  DownloadIcon, RefreshIcon, InfoIcon, XIcon, PlusIcon,
  AlertTriangleIcon, CheckCircleIcon, PackageIcon, ImageIcon,
  ExternalLinkIcon
} from './Icons';

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
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

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
    if (!label) {
      alert('الرجاء إدخال اسم المدة');
      return;
    }
    if (!months || months <= 0) {
      alert('الرجاء إدخال عدد أشهر صحيح');
      return;
    }
    onAddDuration(label, months);
    setNewDurationLabel('');
    setNewDurationMonths('');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('الرجاء اختيار ملف صورة (PNG, SVG, JPG)');
      return;
    }
    if (file.size > 500 * 1024) {
      alert('حجم الصورة كبير جداً. الحد الأقصى 500 كيلوبايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onLogoChange(event.target.result);
    };
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

      <div className="settings-grid">
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
            <p className="settings-logo-hint">الحد الأقصى: 500 كيلوبايت — يتكيف لونه تلقائياً مع الوضع الداكن/الفاتح</p>
          </div>
        </div>

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

        <div className="settings-card">
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
                    if (confirm(`هل تريد حذف المدة "${dur.label}"؟`)) {
                      onDeleteDuration(dur.id);
                    }
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

        <div className="settings-card settings-card-wide">
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
      </div>

      <div className="settings-info-footer">
        <InfoIcon className="icon-sm" />
        <span>الإصدار 2.0.0</span>
        <span className="settings-info-sep">•</span>
        <span>الحفظ تلقائي (متصفح محلي)</span>
        <span className="settings-info-sep">•</span>
        <span>اللغة: العربية</span>
      </div>
    </div>
  );
}

export default SettingsPage;
