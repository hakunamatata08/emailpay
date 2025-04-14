"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import { Transaction } from "@/types/transaction";

// Define notification item interface
export interface NotificationItem {
  id: string;
  type: 'sent' | 'received' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  transaction?: Transaction;
}

// Define context type
interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  fetchNotifications: async () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearNotifications: () => {},
});

// Provider component
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, getAddress } = useWeb3Auth();

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      const address = await getAddress();
      if (!address) return;

      // Fetch user's sent transactions
      const sentResponse = await fetch(`/api/transactions?userAddress=${address}`);
      if (!sentResponse.ok) throw new Error("Failed to fetch sent transactions");
      const sentTransactions = await sentResponse.json();

      // Fetch transactions where user is a recipient
      const receivedResponse = await fetch(`/api/transactions/received?recipientAddress=${address}`);
      if (!receivedResponse.ok) throw new Error("Failed to fetch received transactions");
      const receivedTransactions = await receivedResponse.json();

      // Process transactions into notifications
      const notificationItems: NotificationItem[] = [
        ...sentTransactions.map((tx: Transaction) => ({
          id: tx._id?.toString() || crypto.randomUUID(),
          type: 'sent' as const,
          title: `You sent ${tx.amount} ${tx.tokenType}`,
          message: `You sent ${tx.amount} ${tx.tokenType} to ${tx.toRecipients.map(r => r.name || r.email).join(', ')}`,
          timestamp: new Date(tx.createdAt),
          read: false,
          transaction: tx
        })),
        ...receivedTransactions.map((tx: Transaction) => ({
          id: tx._id?.toString() || crypto.randomUUID(),
          type: 'received' as const,
          title: `You received ${tx.amount} ${tx.tokenType}`,
          message: `${tx.userAddress.slice(0, 6)}...${tx.userAddress.slice(-4)} sent you ${tx.amount} ${tx.tokenType}`,
          timestamp: new Date(tx.createdAt),
          read: false,
          transaction: tx
        }))
      ];

      // Sort by timestamp (newest first)
      notificationItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Update state
      setNotifications(notificationItems);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Fetch notifications on load and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated]);

  // Setup periodic refresh (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);
