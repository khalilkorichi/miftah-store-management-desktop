import React, { useState } from 'react';
import { XIcon, FlagIcon, TagIcon, SparklesIcon, CheckSquareIcon } from '../Icons';

const TEMPLATES = [
  {
    id: 'price_review',
    title: 'مراجعة أسعار المنتجات',
    category: 'ops',
    priority: 'medium',
    icon: '💰',
    description: 'مراجعة أسعار جميع المنتجات وإعادة حساب هوامش الربح بناءً على أسعار الموردين الحالية.',
  },
  {
    id: 'margin_check',
    title: 'فحص هامش الربح',
    category: 'ops',
    priority: 'medium',
    icon: '📊',
    description: 'تحليل هوامش الربح لكل منتج والتحقق من أن النسب لا تقل عن الحد الأدنى المطلوب.',
  },
  {
    id: 'new_supplier',
    title: 'متابعة مورد جديد',
    category: 'admin',
    priority: 'high',
    icon: '🤝',
    description: 'التواصل مع المورد الجديد للحصول على العينات والأسعار وتقييم جودة الخدمة.',
  },
  {
    id: 'new_product',
    title: 'إضافة منتج جديد',
    category: 'inventory',
    priority: 'high',
    icon: '📦',
    description: 'إضافة منتج جديد للمتجر: إنشاء الصفحة، تحديد الأسعار، رفع الوصف، والصور.',
  },
  {
    id: 'renewal',
    title: 'متابعة تجديد الاشتراك',
    category: 'admin',
    priority: 'urgent',
    icon: '🔄',
    description: 'التواصل مع المورد لتجديد الاشتراك قبل انتهاء الصلاحية وتحديث الكميات المتاحة.',
  },
  {
    id: 'customer_support',
    title: 'رد على استفسار عميل',
    category: 'support',
    priority: 'normal',
    icon: '💬',
    description: 'متابعة استفسار العميل وتقديم الدعم اللازم وإرسال دليل التفعيل إذا احتاج.',
  },
  {
    id: 'marketing',
    title: 'حملة تسويق للمنتج',
    category: 'marketing',
    priority: 'medium',
    icon: '📣',
    description: 'إعداد محتوى تسويقي للمنتج وجدولة منشورات على منصات التواصل الاجتماعي.',
  },
  {
    id: 'coupons_review',
    title: 'مراجعة الكوبونات النشطة',
    category: 'ops',
    priority: 'normal',
    icon: '🎫',
    description: 'مراجعة جميع الكوبونات النشطة والتحقق من صلاحيتها وإلغاء المنتهية منها.',
  },
];

const CATEGORY_COLORS = {
  ops: '#5E4FDE',
  admin: '#1A51F4',
  support: '#11BA65',
  inventory: '#F7784A',
  marketing: '#FFC530',
  other: '#9ca3b8',
};

const CATEGORY_LABELS = {
  ops: 'تشغيل',
  admin: 'إداري',
  support: 'دعم عملاء',
  inventory: 'مخزون',
  marketing: 'تسويق',
};

const PRIORITY_COLORS = {
  normal: '#9ca3b8',
  medium: '#FFC530',
  high: '#F7784A',
  urgent: '#F94B60',
};

const PRIORITY_LABELS = {
  normal: 'عادية',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

export default function TaskTemplatesModal({ onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter(t =>
    !search || t.title.includes(search) || t.description.includes(search)
  );

  const handleSelect = (tpl) => {
    onSelect({
      title: tpl.title,
      description: tpl.description,
      category: tpl.category,
      priority: tpl.priority,
      status: 'pending',
      dueDate: '',
    });
    onClose();
  };

  return (
    <div className="ops-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ops-modal tpl-modal">
        <div className="ops-modal-header">
          <h2 className="ops-modal-title">
            <SparklesIcon className="icon-sm" />
            قوالب المهام الجاهزة
          </h2>
          <button className="ops-modal-close" onClick={onClose} aria-label="إغلاق">
            <XIcon className="icon-sm" />
          </button>
        </div>

        <div className="tpl-modal-search">
          <input
            type="text"
            className="ops-form-input"
            placeholder="ابحث في القوالب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="tpl-modal-body">
          <div className="tpl-grid">
            {filtered.map(tpl => (
              <button
                key={tpl.id}
                className="tpl-card"
                onClick={() => handleSelect(tpl)}
              >
                <div className="tpl-card-icon">{tpl.icon}</div>
                <div className="tpl-card-content">
                  <div className="tpl-card-title">{tpl.title}</div>
                  <div className="tpl-card-desc">{tpl.description}</div>
                  <div className="tpl-card-badges">
                    <span className="tpl-badge" style={{ '--badge-color': CATEGORY_COLORS[tpl.category] }}>
                      <TagIcon className="icon-xs" /> {CATEGORY_LABELS[tpl.category]}
                    </span>
                    <span className="tpl-badge" style={{ '--badge-color': PRIORITY_COLORS[tpl.priority] }}>
                      <FlagIcon className="icon-xs" /> {PRIORITY_LABELS[tpl.priority]}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="tpl-empty">
                <CheckSquareIcon className="icon-lg" />
                <p>لا توجد قوالب مطابقة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
