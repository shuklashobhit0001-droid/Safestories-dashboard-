import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Loader } from './Loader';

interface Notification {
  notification_id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
}

interface NotificationsProps {
  userRole: string;
  userId: string;
}

export const Notifications: React.FC<NotificationsProps> = ({ userRole, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [userId, userRole]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?user_id=${userId}&user_role=${userRole}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId })
      });
      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.notification_id === notificationId ? { ...n, is_read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId })
      });
      if (response.ok) {
        setNotifications(notifications.filter(n => n.notification_id !== notificationId));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_role: userRole })
      });
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'all' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'unread' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`bg-white rounded-lg border p-4 flex items-start gap-4 ${
                !notification.is_read ? 'border-l-4 border-l-teal-600' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className={`font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500">{formatTime(notification.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600">{notification.message}</p>
              </div>
              <div className="flex gap-2">
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.notification_id)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-teal-600"
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.notification_id)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
