import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
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
  const [filter, setFilter] = useState<'all' | 'new_bookings' | 'sos_alerts' | 'client_transfers'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 10;

  useEffect(() => {
    fetchNotifications();
  }, [userId, userRole]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?user_id=${userId}&user_role=${userRole}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Received notifications:', data.length);
        console.log('📅 First notification created_at:', data[0]?.created_at);
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
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
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

  // Filter notifications based on selected category
  const filteredNotifications = (() => {
    switch (filter) {
      case 'new_bookings':
        return notifications.filter(n => 
          n.notification_type === 'new_booking' || 
          n.notification_type === 'new_booking_request'
        );
      case 'sos_alerts':
        return notifications.filter(n => n.notification_type === 'sos_ticket');
      case 'client_transfers':
        return notifications.filter(n => 
          n.notification_type === 'client_transfer' || 
          n.notification_type === 'client_transfer_in' || 
          n.notification_type === 'client_transfer_out'
        );
      case 'all':
      default:
        return notifications;
    }
  })();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const endIndex = startIndex + notificationsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) {
      console.warn('⚠️ Missing timestamp');
      return 'Unknown';
    }
    
    // Parse timestamp - if it doesn't have timezone info, treat it as UTC
    // This fixes the issue where production shows "Just now" for all notifications
    let date: Date;
    if (timestamp.includes('Z') || timestamp.includes('+')) {
      // Already has timezone info
      date = new Date(timestamp);
    } else {
      // No timezone info - assume UTC and convert to local
      date = new Date(timestamp + 'Z');
    }
    
    if (isNaN(date.getTime())) {
      console.warn('⚠️ Invalid timestamp:', timestamp);
      return 'Invalid date';
    }
    
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
          All
        </button>
        <button
          onClick={() => setFilter('new_bookings')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'new_bookings' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          New Bookings
        </button>
        <button
          onClick={() => setFilter('sos_alerts')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'sos_alerts' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          SOS Alerts
        </button>
        <button
          onClick={() => setFilter('client_transfers')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'client_transfers' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Client Transfers
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg">
            {filter === 'new_bookings' ? 'No new booking notifications' : 
             filter === 'sos_alerts' ? 'No SOS alert notifications' :
             filter === 'client_transfers' ? 'No client transfer notifications' :
             'No notifications yet'}
          </p>
        </div>
      ) : (
        <div>
          <div className="space-y-2">
            {paginatedNotifications.map((notification) => (
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
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.notification_id)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-teal-600"
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredNotifications.length > notificationsPerPage && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)} of {filteredNotifications.length} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  ←
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white border hover:bg-gray-50'
                  }`}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
};
