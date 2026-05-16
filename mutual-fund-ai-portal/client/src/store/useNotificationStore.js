import { create } from "zustand";
import API from "../services/api";

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  fetchNotifications: async () => {
    try {
      const res = await API.get("/notifications");
      const notifs = res.data;
      const unread = notifs.filter(n => !n.read).length;
      set({ notifications: notifs, unreadCount: unread });
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  markAsRead: async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map(n => 
          n._id === id ? { ...n, read: true } : n
        );
        return { 
          notifications: updated,
          unreadCount: Math.max(0, state.unreadCount - 1)
        };
      });
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await API.put("/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  }
}));

export default useNotificationStore;
