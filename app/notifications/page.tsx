'use client';

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell,
  CheckCircle2,
  XCircle,
  Trash2,
  Filter,
  Search,
  Eye,
  EyeOff,
  Clock,
  Package,
  Truck,
  RotateCcw,
  AlertTriangle,
  Info,
  CheckCheck,
  RefreshCw,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Badge } from "@/components/UI/Badge";
import Loader from "@/components/UI/Loader";
import { API_BASE_URL } from "@/lib/config";

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: number;
  created_at: string;
  updated_at?: string;
}

interface NotificationsResponse {
  success: boolean;
  data?: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    unreadCount: number;
  };
  error?: string;
}

interface NotificationsStats {
  total: number;
  unread: number;
  read: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationsStats>({
    total: 0,
    unread: 0,
    read: 0
  });
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Fetch notifications data - following inventory pattern
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/notifications`);
      
      if (!res.ok) throw new Error("Failed to fetch notifications");

      const data: NotificationsResponse = await res.json();

      if (data.success && data.data) {
        setNotifications(data.data.notifications);
        setStats({
          total: data.data.pagination.total,
          unread: data.data.unreadCount,
          read: data.data.pagination.total - data.data.unreadCount
        });
      } else {
        throw new Error(data.error || "Failed to load notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
      setStats({ total: 0, unread: 0, read: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: number, isRead: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_read: isRead }),
      });

      const data = await res.json();

      if (data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id
              ? { ...notification, is_read: isRead ? 1 : 0 }
              : notification
          )
        );
        // Refresh stats
        fetchNotifications();
      } else {
        throw new Error(data.error || "Failed to update notification");
      }
    } catch (err) {
      console.error("Error updating notification:", err);
      alert("Failed to update notification. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(-1);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      const data = await res.json();

      if (data.success) {
        // Refresh everything
        fetchNotifications();
        alert("All notifications marked as read!");
      } else {
        throw new Error(data.error || "Failed to mark all as read");
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
      alert("Failed to mark all notifications as read. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    setActionLoading(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data.success) {
        // Remove from local state and refresh
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        fetchNotifications(); // Refresh stats
      } else {
        throw new Error(data.error || "Failed to delete notification");
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      alert("Failed to delete notification. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAllRead = async () => {
    if (!confirm("Are you sure you want to delete all read notifications?")) return;

    setActionLoading(-2);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAllRead: true }),
      });

      const data = await res.json();

      if (data.success) {
        // Refresh everything
        fetchNotifications();
        alert("All read notifications deleted!");
      } else {
        throw new Error(data.error || "Failed to delete read notifications");
      }
    } catch (err) {
      console.error("Error deleting read notifications:", err);
      alert("Failed to delete read notifications. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter notifications based on search and filter - using useMemo like inventory
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch =
        !searchQuery ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filter === "all" || (filter === "unread" && notification.is_read === 0);

      return matchesSearch && matchesFilter;
    });
  }, [notifications, searchQuery, filter]);

  // Group notifications by date
  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });
    
    return groups;
  };

  const notificationGroups = groupNotificationsByDate(filteredNotifications);

  const getNotificationIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      success: CheckCircle2,
      info: Info,
      warning: AlertTriangle,
      error: Package,
      dispatch: Truck,
      delivery: CheckCircle2,
      return: RotateCcw,
      system: Bell
    };
    
    return icons[type] || Bell;
  };

  const getNotificationColor = (type: string) => {
    const colors: { [key: string]: string } = {
      success: "text-green-600 bg-green-100",
      info: "text-blue-600 bg-blue-100",
      warning: "text-yellow-600 bg-yellow-100",
      error: "text-red-600 bg-red-100",
      dispatch: "text-purple-600 bg-purple-100",
      delivery: "text-green-600 bg-green-100",
      return: "text-orange-600 bg-orange-100",
      system: "text-gray-600 bg-gray-100"
    };
    
    return colors[type] || "text-gray-600 bg-gray-100";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Enhanced button styles like inventory page
  const buttonStyles = {
    primary: 'bg-primary-600 hover:bg-primary-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-all duration-200',
    danger: 'text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" label="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-heading">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {stats.unread > 0 
                  ? `${stats.unread} unread notification${stats.unread !== 1 ? 's' : ''}`
                  : 'All caught up!'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={handleRefresh}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className={buttonStyles.outline}
            >
              Refresh
            </Button>
            
            {stats.unread > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                disabled={actionLoading === -1}
                leftIcon={<CheckCheck className="h-4 w-4" />}
                className={buttonStyles.primary}
              >
                {actionLoading === -1 ? 'Marking...' : 'Mark All Read'}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.unread}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <EyeOff className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Read</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.read}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Quick Actions</p>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAllRead}
                  disabled={actionLoading === -2 || stats.read === 0}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  className={`w-full justify-start ${buttonStyles.outline}`}
                >
                  {actionLoading === -2 ? 'Deleting...' : 'Clear Read'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-full sm:w-80">
                  <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant={filter === "all" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className={filter === "all" ? buttonStyles.primary : buttonStyles.outline}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === "unread" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setFilter("unread")}
                    className={filter === "unread" ? buttonStyles.primary : buttonStyles.outline}
                  >
                    Unread
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {filteredNotifications.length} of {stats.total} notifications
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardContent className="p-0">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-500">
                  {searchQuery || filter !== 'all'
                    ? "Try adjusting your search or filters"
                    : "You're all caught up! No notifications to display."
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {Object.entries(notificationGroups).map(([date, dayNotifications]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                    </div>
                    
                    {/* Notifications for this date */}
                    {dayNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      const colorClass = getNotificationColor(notification.type);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-6 hover:bg-gray-50 transition-colors duration-150 ${
                            notification.is_read ? 'bg-white' : 'bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Notification Icon */}
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            
                            {/* Notification Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge 
                                      variant={notification.is_read ? "secondary" : "primary"}
                                      className="text-xs"
                                    >
                                      {notification.type.toUpperCase()}
                                    </Badge>
                                    {!notification.is_read && (
                                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                  </div>
                                  <p className="text-gray-900 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-2 flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDate(notification.created_at)}</span>
                                  </p>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center space-x-2 ml-4">
                                  {notification.is_read ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id, false)}
                                      disabled={actionLoading === notification.id}
                                      leftIcon={<EyeOff className="h-4 w-4" />}
                                      className={buttonStyles.ghost}
                                    >
                                      {actionLoading === notification.id ? '...' : 'Mark Unread'}
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id, true)}
                                      disabled={actionLoading === notification.id}
                                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                                      className="text-green-600 hover:text-green-900 hover:bg-green-50"
                                    >
                                      {actionLoading === notification.id ? '...' : 'Mark Read'}
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNotification(notification.id)}
                                    disabled={actionLoading === notification.id}
                                    className={buttonStyles.danger}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}