import React from "react";
import { Bell } from "phosphor-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, NotificationItem } from "@/providers/NotificationProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowRight, CheckCircle, Clock, XCircle, CurrencyCircleDollar, CaretDown, X } from "phosphor-react";
import Link from "next/link";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = React.useState(false);

  // Handle notification click
  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Close the popover
    setOpen(false);
  };

  // Get status icon based on transaction status
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CurrencyCircleDollar className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get the notification icon based on the type
  const getNotificationIcon = (notification: NotificationItem) => {
    if (notification.type === "sent") {
      return <ArrowRight className="h-4 w-4 text-orange-500" />;
    } else if (notification.type === "received") {
      return <ArrowRight className="h-4 w-4 text-green-500 transform rotate-180" />;
    }
    return getStatusIcon(notification.transaction?.status);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neon-purple text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto text-xs py-1 px-2"
            >
              Mark all as read
            </Button>
          )}
        </div>
        {notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 p-4 hover:bg-muted transition-colors",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {getNotificationIcon(notification)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm font-medium", !notification.read && "text-primary")}>
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {format(notification.timestamp, "h:mm a")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(notification.timestamp, "MMM d, yyyy")}
                    </p>
                    {notification.transaction && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {getStatusIcon(notification.transaction.status)}
                        <span>
                          {notification.transaction.status.charAt(0).toUpperCase() +
                            notification.transaction.status.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <Bell className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
        <div className="border-t p-2">
          <Link href="/transactions" className="block">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => setOpen(false)}
            >
              <span>View all transactions</span>
              <CaretDown className="h-4 w-4 rotate-[-90deg]" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
