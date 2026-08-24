"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchNotifications(user.id);
      }
    };
    getUser();

    // Polling every 30 seconds
    const interval = setInterval(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) fetchNotifications(user.id);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (uid: string) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("patient_id", uid)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications(data || []);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("patient_id", userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTypeColor = (type: string) => {
    if (type === "token_booked") return "bg-blue-100 text-blue-700";
    if (type === "turn_approaching") return "bg-yellow-100 text-yellow-700";
    if (type === "your_turn") return "bg-green-100 text-green-700";
    if (type === "completed") return "bg-slate-100 text-slate-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
            <h3 className="font-semibold text-slate-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-2xl mb-2">🔕</p>
                <p className="text-slate-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${!n.is_read ? "bg-blue-50/50 dark:bg-blue-950/30" : ""}`}
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${getTypeColor(n.type)}`}
                    >
                      {n.type.replace("_", " ")}
                    </span>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(n.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
