"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getAllNotifications,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/app/actions/dashboard";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const setNotificationCount = useAppStore((s) => s.setNotificationCount);

  useEffect(() => {
    async function fetchAndClear() {
      const data = await getAllNotifications();
      // Snapshot which were unread before we mark them all read below
      setNotifications(data.map((n: any) => ({ ...n, wasUnread: !n.read })));
      setIsLoading(false);

      const hasUnread = data.some((n: any) => !n.read);
      if (hasUnread) {
        await markAllNotificationsRead();
        setNotificationCount(0);
      }
    }
    fetchAndClear();
  }, [setNotificationCount]);

  async function handleClearOne(id: string) {
    setClearingId(id);
    try {
      const res = await deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } else {
        toast.error(res.error || "Failed to clear notification");
      }
    } finally {
      setClearingId(null);
    }
  }

  async function handleClearAll() {
    setIsClearingAll(true);
    try {
      const res = await clearAllNotifications();
      if (res.success) {
        setNotifications([]);
        toast.success("All notifications cleared");
      } else {
        toast.error(res.error || "Failed to clear notifications");
      }
    } finally {
      setIsClearingAll(false);
    }
  }

  const formatTimeAgo = (dateInput: any) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="text-slate-500">Live platform updates and logistics alerts.</p>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleClearAll}
            disabled={isClearingAll}
          >
            {isClearingAll ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            Clear All
          </Button>
        )}
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <div className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="animate-spin text-emerald-600 h-8 w-8" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No notifications yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group flex items-start gap-4 p-6 transition-colors ${
                    notif.wasUnread ? "bg-emerald-50/40" : ""
                  } hover:bg-slate-50`}
                >
                  <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${
                    notif.wasUnread ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                  }`}>
                    <Bell size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">{notif.user?.name || "Platform"}</h4>
                      {notif.wasUnread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">{formatTimeAgo(notif.createdAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClearOne(notif.id)}
                    disabled={clearingId === notif.id}
                    className="shrink-0 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-100"
                    aria-label="Clear notification"
                  >
                    {clearingId === notif.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
