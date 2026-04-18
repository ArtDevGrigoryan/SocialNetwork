import { useState, useEffect } from "react";
import { Loader2, Bell } from "lucide-react";
import { api } from "../../lib/axios.config";
import type { AlertType } from "../../components/message-popup/alert";

interface Props {
  showAlert: (type: AlertType, message: string) => void;
}

export default function NotificationSettings({ showAlert }: Props) {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const notifCategories = [
    {
      title: "Direct Interactions",
      items: [
        {
          key: "message",
          label: "Messages",
          desc: "Receive notifications for new messages.",
        },
        {
          key: "like",
          label: "Likes",
          desc: "When someone likes your posts or stories.",
        },
      ],
    },
    {
      title: "Content Updates",
      items: [
        {
          key: "new_post",
          label: "New Posts",
          desc: "When someone you follow shares a new post.",
        },
        {
          key: "new_story",
          label: "New Stories",
          desc: "When someone you follow adds a new story.",
        },
      ],
    },
    {
      title: "Friends & Followers",
      items: [
        {
          key: "follow",
          label: "New Followers",
          desc: "When someone starts following you.",
        },
        {
          key: "unfollow",
          label: "Unfollowers",
          desc: "When someone unfollows you.",
        },
        {
          key: "accept_request",
          label: "Accepted Requests",
          desc: "When your follow request is accepted.",
        },
        {
          key: "decline_request",
          label: "Declined Requests",
          desc: "When your follow request is declined.",
        },
        {
          key: "cancel_request",
          label: "Canceled Requests",
          desc: "When someone cancels their follow request.",
        },
      ],
    },
    {
      title: "Group Chats",
      items: [
        {
          key: "new_group",
          label: "New Group",
          desc: "When you are added to a new group chat.",
        },
        {
          key: "group_removed",
          label: "Group Removed",
          desc: "When a group you are in is deleted.",
        },
        {
          key: "group_member_removed",
          label: "Removed from Group",
          desc: "When you are removed from a group.",
        },
        {
          key: "group_member_removed_notice",
          label: "Group Member Left/Removed",
          desc: "When another member is removed from a group.",
        },
      ],
    },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get("/settings");
        if (data.payload?.notifications) {
          setSettings(data.payload.notifications);
        }
      } catch (err) {
        console.error("Failed to fetch notification settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = async (typeKey: string) => {
    const previousState = settings[typeKey];
    setSettings((prev) => ({ ...prev, [typeKey]: !previousState }));

    try {
      const { data } = await api.patch("/settings/notifications", {
        type: typeKey,
      });
      if (data.payload) {
        setSettings((prev) => ({ ...prev, ...data.payload }));
      }
    } catch (err: any) {
      setSettings((prev) => ({ ...prev, [typeKey]: previousState }));
      showAlert(
        "error",
        err.response?.data?.message || "Failed to update notification setting.",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-neutral-500 w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8 animate-in fade-in">
      <div className="hidden md:block">
        <h2 className="text-2xl text-white mb-2 flex items-center gap-2">
          <Bell className="text-neutral-400" /> Push Notifications
        </h2>
        <p className="text-sm text-neutral-400">
          Choose what you want to be notified about.
        </p>
      </div>

      <div className="space-y-6">
        {notifCategories.map((category) => (
          <div
            key={category.title}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="bg-neutral-800/40 px-5 py-3 border-b border-neutral-800">
              <h3 className="font-semibold text-neutral-300 text-sm">
                {category.title}
              </h3>
            </div>
            <div className="flex flex-col">
              {category.items.map((notif, index) => (
                <div
                  key={notif.key}
                  className={`flex items-center justify-between p-5 ${index !== category.items.length - 1 ? "border-b border-neutral-800" : ""}`}
                >
                  <div className="pr-6">
                    <p className="font-medium text-white text-[15px]">
                      {notif.label}
                    </p>
                    <p className="text-[13px] text-neutral-400 mt-1 leading-relaxed">
                      {notif.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(notif.key)}
                    className={`w-11 h-6 flex items-center rounded-full px-1 transition-colors shrink-0 outline-none ${
                      settings[notif.key] ? "bg-blue-500" : "bg-neutral-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings[notif.key] ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
