'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: number;
  title: string;
  body: string;
  targetUrl: string;
  read: boolean;
  sentAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter((n: Notification) => !n.read).length);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#8a8a9a] hover:text-white transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-[#ff1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a0f] border border-[#1a1a24] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-[#1a1a24]">
              <h3 className="font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-[#00f0ff] hover:text-[#00f0ff]/80"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-[#8a8a9a] text-sm">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (notification.targetUrl) {
                        window.open(notification.targetUrl, '_blank');
                      }
                    }}
                    className={`p-3 border-b border-[#1a1a24] cursor-pointer hover:bg-[#1a1a24] transition-colors ${
                      !notification.read ? 'bg-[#ff1a1a]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read && (
                        <span className="w-2 h-2 bg-[#ff1a1a] rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{notification.title}</p>
                        <p className="text-xs text-[#8a8a9a] line-clamp-2">{notification.body}</p>
                        <p className="text-[10px] text-[#5a5a6a] mt-1">
                          {new Date(notification.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
