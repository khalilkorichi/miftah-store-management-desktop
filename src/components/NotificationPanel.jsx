import { useState, useRef, useEffect, useCallback } from 'react';
import { useNotifications, CATEGORY_MAP } from './NotificationContext';
import {
  BellIcon, XIcon, CheckAllIcon, Trash2Icon, ClockIcon,
  PackageIcon, DollarSignIcon, GiftIcon, CheckSquareIcon, SettingsIcon,
  InfoIcon, CheckCircleIcon, AlertTriangleIcon, XCircleIcon,
} from './Icons';

const CATEGORY_ICONS = {
  products: PackageIcon,
  pricing: DollarSignIcon,
  bundles: GiftIcon,
  operations: CheckSquareIcon,
  system: SettingsIcon,
};

const TYPE_ICONS = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'الآن';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
  const date = new Date(timestamp);
  return date.toLocaleDateString('ar-SA-u-nu-latn', { month: 'short', day: 'numeric' });
}

function NotificationPanel({ isOpen, onClose, onNavigate }) {
  const { notifications, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications();
  const [activeCategory, setActiveCategory] = useState('all');
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const triggerClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose(), 180);
  }, [onClose]);

  useEffect(() => {
    if (!visible || closing) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const bellBtn = e.target.closest('.notif-bell-btn');
        if (!bellBtn) triggerClose();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') triggerClose();
    };
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }, 10);
    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [visible, closing, triggerClose]);

  const filtered = activeCategory === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeCategory);

  const handleNotificationClick = useCallback((notification) => {
    markAsRead(notification.id);
    if (notification.actionTab && onNavigate) {
      onNavigate(notification.actionTab);
      triggerClose();
    }
  }, [markAsRead, onNavigate, triggerClose]);

  const categories = [
    { id: 'all', label: 'الكل' },
    ...Object.entries(CATEGORY_MAP).map(([id, { label }]) => ({ id, label })),
  ];

  if (!visible) return null;

  return (
    <div className={`notif-panel ${closing ? 'notif-panel-closing' : ''}`} ref={panelRef} id="notif-panel" role="dialog" aria-label="لوحة الإشعارات">
      <div className="notif-panel-header">
        <div className="notif-panel-title-row">
          <h3 className="notif-panel-title">
            <BellIcon className="icon-sm" />
            الإشعارات
            {unreadCount > 0 && (
              <span className="notif-panel-count">{unreadCount}</span>
            )}
          </h3>
          <div className="notif-panel-actions">
            {unreadCount > 0 && (
              <button className="notif-action-btn notif-action-labeled" onClick={markAllAsRead} title="تحديد الكل كمقروء" aria-label="تحديد الكل كمقروء">
                <CheckAllIcon className="icon-xs" />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button className="notif-action-btn notif-action-danger notif-action-labeled" onClick={clearAll} title="مسح الكل" aria-label="مسح جميع الإشعارات">
                <Trash2Icon className="icon-xs" />
                <span>مسح الكل</span>
              </button>
            )}
            <button className="notif-action-btn" onClick={triggerClose} title="إغلاق" aria-label="إغلاق لوحة الإشعارات">
              <XIcon className="icon-xs" />
            </button>
          </div>
        </div>

        <div className="notif-category-tabs">
          {categories.map(cat => {
            const catCount = cat.id === 'all'
              ? notifications.filter(n => !n.read).length
              : notifications.filter(n => n.category === cat.id && !n.read).length;
            return (
              <button
                key={cat.id}
                className={`notif-cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
                {catCount > 0 && <span className="notif-cat-badge">{catCount}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="notif-panel-body">
        {filtered.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <BellIcon className="icon-lg" />
            </div>
            <p className="notif-empty-title">لا توجد إشعارات</p>
            <p className="notif-empty-desc">
              {activeCategory === 'all'
                ? 'ستظهر الإشعارات هنا عند تنفيذ أي إجراء'
                : `لا توجد إشعارات في قسم ${categories.find(c => c.id === activeCategory)?.label || ''}`
              }
            </p>
          </div>
        ) : (
          <div className="notif-list">
            {filtered.map(n => {
              const TypeIcon = TYPE_ICONS[n.type] || InfoIcon;
              const CatIcon = CATEGORY_ICONS[n.category] || SettingsIcon;
              return (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? 'notif-unread' : ''} notif-type-${n.type}`}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(n); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.title} - ${n.description || ''}`}
                >
                  <div className={`notif-item-icon notif-icon-${n.type}`}>
                    <TypeIcon className="icon-sm" />
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-header">
                      <span className="notif-item-title">{n.title}</span>
                      {!n.read && <span className="notif-unread-dot" />}
                    </div>
                    {n.description && (
                      <p className="notif-item-desc">{n.description}</p>
                    )}
                    <div className="notif-item-meta">
                      <span className="notif-item-time">
                        <ClockIcon className="icon-xs" />
                        {formatRelativeTime(n.timestamp)}
                      </span>
                      <span className="notif-item-cat" style={{ color: CATEGORY_MAP[n.category]?.color }}>
                        <CatIcon className="icon-xs" />
                        {CATEGORY_MAP[n.category]?.label || 'النظام'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;
