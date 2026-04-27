import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Check, X, UserMinus } from "lucide-react";
import {
  useRequestStore,
  type FriendRequestItem,
} from "../../store/request.store";
import { cn } from "../../lib/utils";

export default function RequestsPage() {
  const { requests, loading, activeTab, setTab, fetchRequests, actionRequest } =
    useRequestStore();

  useEffect(() => {
    fetchRequests("incoming");
  }, [fetchRequests]);

  const getTargetUser = (req: FriendRequestItem) =>
    activeTab === "incoming" ? req.sender : req.receiver;

  return (
    <div className="max-w-2xl mx-auto w-full p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">Follow Requests</h1>

        <div className="flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setTab("incoming")}
            className={cn(
              "pb-3 text-sm font-semibold transition-colors relative",
              activeTab === "incoming"
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-300",
            )}
          >
            Received
            {activeTab === "incoming" && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-white rounded-t-md" />
            )}
          </button>
          <button
            onClick={() => setTab("outgoing")}
            className={cn(
              "pb-3 text-sm font-semibold transition-colors relative",
              activeTab === "outgoing"
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-300",
            )}
          >
            Sent
            {activeTab === "outgoing" && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-white rounded-t-md" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900/40 rounded-2xl border border-neutral-800 border-dashed">
            <div className="text-neutral-400 text-sm">
              {activeTab === "incoming"
                ? "No pending requests"
                : "No outgoing requests"}
            </div>
            <div className="text-neutral-500 text-xs mt-1">
              {activeTab === "incoming"
                ? "When someone asks to follow you, it will show up here."
                : "Requests you send will appear here until they are accepted."}
            </div>
          </div>
        ) : (
          requests.map((request) => {
            const user = getTargetUser(request);
            if (!user) return null;

            return (
              <div
                key={request._id}
                className="flex items-center justify-between p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl hover:bg-neutral-800/60 transition-colors"
              >
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border border-neutral-700 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[15px] font-semibold text-white truncate">
                      {user.username}
                    </span>
                    {user.bio && (
                      <span className="text-[13px] text-neutral-400 truncate">
                        {user.bio}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {activeTab === "incoming" ? (
                    <>
                      <button
                        onClick={() => actionRequest(request, "accept")}
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition"
                      >
                        <Check size={16} className="mr-1 hidden sm:block" />
                        Confirm
                      </button>
                      <button
                        onClick={() => actionRequest(request, "decline")}
                        className="flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg px-4 py-2 text-sm font-semibold transition"
                      >
                        <X size={16} className="mr-1 hidden sm:block" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => actionRequest(request, "cancel")}
                      className="flex items-center justify-center bg-neutral-800 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 rounded-lg px-4 py-2 text-sm font-semibold transition"
                    >
                      <UserMinus size={16} className="mr-1 hidden sm:block" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
