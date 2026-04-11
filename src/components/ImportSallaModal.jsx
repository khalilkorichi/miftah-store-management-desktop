import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  XIcon, UploadIcon, CheckCircleIcon, PackageIcon,
  AlertTriangleIcon, TagIcon, SearchIcon, CheckIcon
} from './Icons';
import ModalOverlay from './ModalOverlay';

// ── Salla Excel Parser ─────────────────────────────────────────────────────
function parseSallaExcel(workbook) {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (!rows.length) return { products: [], errors: ['الملف فارغ - لا توجد صفوف بيانات'] };

  // Group: parent "منتج" rows with their child "خيار" rows
  const grouped = [];
  let currentProduct = null;

  for (const row of rows) {
    const type = String(row['النوع'] || '').trim();
    if (type === 'منتج') {
      currentProduct = { parent: row, options: [] };
      grouped.push(currentProduct);
    } else if (type === 'خيار' && currentProduct) {
      currentProduct.options.push(row);
    }
  }

  const products = [];
  const errors = [];

  for (const group of grouped) {
    try {
      const product = mapSallaProduct(group.parent, group.options);
      if (product) products.push(product);
    } catch (e) {
      const name = group.parent['اسم المنتج'] || 'غير معروف';
      errors.push(`خطأ في المنتج "${name}": ${e.message}`);
    }
  }

  return { products, errors };
}

function mapSallaProduct(parentRow, optionRows) {
  // Name
  const name = String(parentRow['اسم المنتج'] || '').trim();
  if (!name) throw new Error('اسم المنتج فارغ');

  // Salla ID (handle Scientific Notation)
  const rawId = String(parentRow['رقم المنتج'] || '');
  const sallaId = parseInt(rawId.replace(/\..*/, ''), 10) || 0;

  // Sale price
  const salePrice = parseFloat(parentRow['السعر']) || 0;

  // Categories
  const catStr = String(parentRow['تصنيف المنتج'] || '').trim();
  const categories = catStr ? catStr.split(',').map((c) => c.trim()).filter(Boolean) : [];

  // ── Extract from option rows ──
  const accountTypes = new Set();
  const activationMethods = new Set();
  const plans = new Set();

  for (const opt of optionRows) {
    // Check all [N] القيمة columns for data
    for (let n = 1; n <= 10; n++) {
      const val = String(opt[`[${n}] القيمة`] || '').trim().toLowerCase();
      if (!val) continue;

      // Account type detection
      if (val.includes('فردي') || val.includes('individual') || val.includes('personal')) {
        accountTypes.add('individual');
      }
      if (val.includes('مشترك') || val.includes('team') || val.includes('فريق') || val.includes('عائلي') || val.includes('family')) {
        accountTypes.add('team');
      }

      // Activation method detection
      if (val.includes('حسابك الخاص') || val.includes('حساب شخصي') || val.includes('حسابك')) {
        activationMethods.add('personal_account');
      }
      if (val.includes('حساب جاهز') || val.includes('جاهز')) {
        activationMethods.add('ready_account');
      }
      if (val.includes('دعوة') || val.includes('رابط') || val.includes('إيميل') || val.includes('invite')) {
        activationMethods.add('invite_link');
      }

      // Plan duration detection
      if (val.includes('6 أشهر') || val.includes('ستة أشهر') || val.includes('6 months')) {
        plans.add('month_6');
      } else if (val.includes('3 أشهر') || val.includes('ثلاثة أشهر') || val.includes('3 months')) {
        plans.add('month_3');
      } else if (val.includes('سنة') || val.includes('سنوي') || val.includes('annual') || val.includes('yearly') || val.includes('12')) {
        plans.add('month_12');
      } else if (val.includes('شهر') || val.includes('month') || val.includes('شهري')) {
        plans.add('month_1');
      }
    }
  }

  // Determine accountType (match existing format)
  let accountType = 'none';
  if (accountTypes.has('individual') && accountTypes.has('team')) {
    accountType = 'individual'; // Default to individual if both
  } else if (accountTypes.has('individual')) {
    accountType = 'individual';
  } else if (accountTypes.has('team')) {
    accountType = 'team';
  }

  // If no plans found from options, default to all plans
  const planIds = plans.size > 0
    ? Array.from(plans)
    : ['month_1', 'month_3', 'month_6', 'month_12'];

  return {
    sallaId,
    name,
    salePrice,
    categories,
    accountType,
    activationMethods: Array.from(activationMethods),
    planIds,
  };
}

// ── Import Modal Component ─────────────────────────────────────────────────
function ImportSallaModal({ isOpen, onClose, onImport, existingProducts, durations, suppliers }) {
  const [parsedProducts, setParsedProducts] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [fileName, setFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState('upload'); // upload, preview, result
  const fileRef = useRef(null);

  const reset = useCallback(() => {
    setParsedProducts([]);
    setParseErrors([]);
    setSelectedIds(new Set());
    setImporting(false);
    setImportResult(null);
    setFileName('');
    setSearchQuery('');
    setStep('upload');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const { products, errors } = parseSallaExcel(workbook);

        setParsedProducts(products);
        setParseErrors(errors);
        setSelectedIds(new Set(products.map((_, i) => i)));
        setStep('preview');
      } catch (err) {
        setParseErrors([`فشل قراءة الملف: ${err.message}`]);
        setStep('preview');
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset file input
    e.target.value = '';
  }, []);

  const toggleSelect = (idx) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(parsedProducts.map((_, i) => i)));
    }
  };

  const handleImport = useCallback(() => {
    setImporting(true);
    const toImport = parsedProducts.filter((_, i) => selectedIds.has(i));
    
    // Convert to the app's product format
    const newProducts = toImport.map((p) => {
      const planEntries = p.planIds.map((durId, idx) => {
        const prices = {};
        suppliers.forEach((s) => { prices[s.id] = 0; });
        return { id: idx + 1, durationId: durId, prices };
      });

      return {
        name: p.name,
        plans: planEntries,
        activationMethods: p.activationMethods,
        accountType: p.accountType,
        sallaId: p.sallaId,
        salePrice: p.salePrice,
        categories: p.categories,
      };
    });

    onImport(newProducts);

    setImportResult({
      imported: newProducts.length,
      skipped: parsedProducts.length - newProducts.length,
    });
    setStep('result');
    setImporting(false);
  }, [parsedProducts, selectedIds, onImport, suppliers]);

  if (!isOpen) return null;

  const getDurationLabel = (durId) => {
    const dur = durations.find((d) => d.id === durId);
    return dur ? dur.label : durId;
  };

  const filteredProducts = searchQuery.trim()
    ? parsedProducts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : parsedProducts;

  return (
    <ModalOverlay onClose={handleClose}>
      <div className="import-salla-modal" role="dialog" aria-labelledby="import-salla-title">
        {/* Header */}
        <div className="import-modal-header">
          <div className="import-modal-title-row">
            <UploadIcon className="icon-md" />
            <h2 id="import-salla-title">استيراد المنتجات من سلة</h2>
          </div>
          <button className="btn-close-modal" onClick={handleClose} aria-label="إغلاق">
            <XIcon className="icon-sm" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="import-steps">
          <div className={`import-step ${step === 'upload' ? 'active' : step !== 'upload' ? 'done' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-label">رفع الملف</span>
          </div>
          <div className="step-connector" />
          <div className={`import-step ${step === 'preview' ? 'active' : step === 'result' ? 'done' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-label">معاينة واختيار</span>
          </div>
          <div className="step-connector" />
          <div className={`import-step ${step === 'result' ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">النتيجة</span>
          </div>
        </div>

        <div className="import-modal-body">
          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div className="import-upload-zone">
              <div
                className="upload-dropzone"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('dragover'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('dragover');
                  const file = e.dataTransfer.files?.[0];
                  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileRef.current.files = dt.files;
                    fileRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }}
              >
                <div className="upload-icon-wrapper">
                  <UploadIcon style={{ width: 48, height: 48, opacity: 0.6 }} />
                </div>
                <p className="upload-main-text">اسحب ملف Excel هنا أو انقر للاختيار</p>
                <p className="upload-sub-text">يدعم ملفات .xlsx المُصدَّرة من منصة سلة</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="upload-info">
                <div className="info-card">
                  <PackageIcon className="icon-sm" />
                  <div>
                    <strong>كيف تُصدّر من سلة؟</strong>
                    <p>لوحة تحكم سلة → المنتجات → تصدير → Excel</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === 'preview' && (
            <div className="import-preview">
              {/* Errors */}
              {parseErrors.length > 0 && (
                <div className="import-errors">
                  <div className="error-header">
                    <AlertTriangleIcon className="icon-sm" />
                    <span>{parseErrors.length} تحذير أثناء القراءة</span>
                  </div>
                  {parseErrors.map((err, i) => (
                    <p key={i} className="error-line">{err}</p>
                  ))}
                </div>
              )}

              {parsedProducts.length > 0 ? (
                <>
                  {/* Toolbar */}
                  <div className="import-toolbar">
                    <div className="import-stats">
                      <PackageIcon className="icon-sm" />
                      <span>تم اكتشاف <strong>{parsedProducts.length}</strong> منتج من ملف <strong>{fileName}</strong></span>
                    </div>
                    <div className="import-search">
                      <SearchIcon className="icon-xs" />
                      <input
                        type="text"
                        placeholder="بحث في المنتجات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Select All */}
                  <div className="import-select-all">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === parsedProducts.length && parsedProducts.length > 0}
                        onChange={toggleAll}
                      />
                      <span>تحديد الكل ({selectedIds.size}/{parsedProducts.length})</span>
                    </label>
                  </div>

                  {/* Products table */}
                  <div className="import-products-list">
                    {filteredProducts.map((product, realIdx) => {
                      // Find the real index in parsedProducts
                      const idx = parsedProducts.indexOf(product);
                      const isSelected = selectedIds.has(idx);
                      const isDuplicate = existingProducts?.some(
                        (ep) => ep.name.toLowerCase() === product.name.toLowerCase() ||
                                (ep.sallaId && ep.sallaId === product.sallaId)
                      );

                      return (
                        <div
                          key={idx}
                          className={`import-product-card ${isSelected ? 'selected' : ''} ${isDuplicate ? 'duplicate' : ''}`}
                          onClick={() => toggleSelect(idx)}
                        >
                          <div className="ipc-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(idx)}
                            />
                          </div>
                          <div className="ipc-info">
                            <div className="ipc-name-row">
                              <span className="ipc-name">{product.name}</span>
                              {isDuplicate && (
                                <span className="ipc-badge badge-warning" title="قد يكون موجوداً مسبقاً">موجود</span>
                              )}
                              {product.accountType !== 'none' && (
                                <span className={`ipc-badge badge-${product.accountType === 'individual' ? 'blue' : 'purple'}`}>
                                  {product.accountType === 'individual' ? 'فردي' : 'فريق'}
                                </span>
                              )}
                            </div>
                            <div className="ipc-meta">
                              {product.salePrice > 0 && (
                                <span className="ipc-tag tag-price">{product.salePrice} ﷼</span>
                              )}
                              {product.planIds.map((pId) => (
                                <span key={pId} className="ipc-tag tag-plan">{getDurationLabel(pId)}</span>
                              ))}
                              {product.categories.slice(0, 2).map((cat, ci) => (
                                <span key={ci} className="ipc-tag tag-category">{cat}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="import-empty">
                  <PackageIcon style={{ width: 48, height: 48, opacity: 0.3 }} />
                  <p>لم يتم اكتشاف أي منتجات في الملف</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="import-actions">
                <button className="btn-back" onClick={() => { reset(); }}>
                  رجوع
                </button>
                <button
                  className="btn-confirm-import"
                  disabled={selectedIds.size === 0 || importing}
                  onClick={handleImport}
                >
                  {importing ? (
                    <><span className="spinner" /> جاري الاستيراد...</>
                  ) : (
                    <><CheckIcon className="icon-sm" /> استيراد {selectedIds.size} منتج</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === 'result' && importResult && (
            <div className="import-result">
              <div className="result-icon-wrapper success">
                <CheckCircleIcon style={{ width: 64, height: 64 }} />
              </div>
              <h3>تم الاستيراد بنجاح!</h3>
              <p className="result-detail">
                تم استيراد <strong>{importResult.imported}</strong> منتج بنجاح إلى برنامج مفتاح
              </p>
              {importResult.skipped > 0 && (
                <p className="result-skipped">تم تخطي {importResult.skipped} منتج (لم يتم اختيارها)</p>
              )}
              <div className="result-actions">
                <button className="btn-done" onClick={handleClose}>
                  تم
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}

export default ImportSallaModal;
