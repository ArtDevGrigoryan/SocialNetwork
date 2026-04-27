import { useEffect, useState } from "react";
import { Loader2, Heart, ChevronRight, Trash2 } from "lucide-react";
import { useNotificationStore } from "../../store/notification.store";
import { cn } from "../../lib/utils";
import { RequestsBanner } from "./components/request-banner";
import { FollowRequestItem } from "./components/request-item";
import { NotificationItem } from "./components/notif-item";
import type { StrictNotification } from "../../types/notification";

export default function NotificationsPage() {
  const {
    notifications,
    incomingRequests,
    isLoading,
    fetchData,
    initPushNotifications,
    deleteAllNotifications,
  } = useNotificationStore();
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    fetchData();
    initPushNotifications();
  }, [fetchData, initPushNotifications]);

  if (
    isLoading &&
    notifications.length === 0 &&
    incomingRequests.length === 0
  ) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto pb-20 pt-4 bg-black min-h-screen">
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Notifications
        </h1>
      </div>

      {!showRequests && (
        <RequestsBanner
          requests={incomingRequests}
          onClick={() => setShowRequests(true)}
        />
      )}

      {showRequests && (
        <div className="mb-4">
          <div
            onClick={() => setShowRequests(false)}
            className="flex items-center gap-2 px-4 py-2 cursor-pointer text-neutral-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span className="text-sm font-semibold">Back to notifications</span>
          </div>
          {incomingRequests.map((request) => (
            <FollowRequestItem key={request._id} request={request} />
          ))}
        </div>
      )}

      <div className={cn("flex flex-col", showRequests && "hidden")}>
        <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-900 mt-2 pt-4">
          <h2 className="text-sm font-bold text-white">New</h2>

          {notifications.length > 0 && (
            <button
              onClick={deleteAllNotifications}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove All
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full border border-neutral-800 flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-neutral-700" />
            </div>
            <p className="text-neutral-400 text-sm">
              Activity on your posts will appear here.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <NotificationItem
              key={item._id}
              item={item as StrictNotification}
            />
          ))
        )}
      </div>
    </div>
  );
}
