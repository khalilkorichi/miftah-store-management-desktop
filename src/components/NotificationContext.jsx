import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'miftah_notifications';
const MAX_NOTIFICATIONS = 100;

const CATEGORY_MAP = {
  products: { label: 'المنتجات', color: '#5E4FDE' },
  pricing: { label: 'التسعير', color: '#1A51F4' },
  bundles: { label: 'الحزم', color: '#11BA65' },
  operations: { label: 'العمليات', color: '#F7784A' },
  system: { label: 'النظام', color: '#F94B60' },
};

const playNotificationSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'error') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {}
};

function loadNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(n => n && typeof n.id !== 'undefined' && typeof n.title === 'string');
    }
  } catch {}
  return [];
}

function saveNotifications(notifications) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(loadNotifications);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  const addNotification = useCallback(({ type = 'info', title, description = '', category = 'system', actionTab = null, playSound = false }) => {
    const notification = {
      id: Date.now() + Math.random(),
      type,
      title,
      description,
      category,
      actionTab,
      read: false,
      timestamp: Date.now(),
    };

    setNotifications(prev => {
      const next = [notification, ...prev];
      return next.slice(0, MAX_NOTIFICATIONS);
    });

    if (playSound) {
      playNotificationSound(type);
    }
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearCategory = useCallback((category) => {
    setNotifications(prev => prev.filter(n => n.category !== category));
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const value = useMemo(() => ({
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearCategory,
    unreadCount,
    CATEGORY_MAP,
  }), [notifications, addNotification, markAsRead, markAllAsRead, clearAll, clearCategory, unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

export { CATEGORY_MAP };
