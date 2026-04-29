import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Check, X, UserMinus } from "lucide-react";
import {
  useRequestStore,
  type FriendRequestItem,
} from "../../store/request.store";
import { cn } from "../../lib/utils";

export default function RequestSettings() {
  const { requests, loading, activeTab, setTab, fetchRequests, actionRequest } =
    useRequestStore();

  useEffect(() => {
    fetchRequests("incoming");
  }, [fetchRequests]);

  const getTargetUser = (req: FriendRequestItem) =>
    activeTab === "incoming" ? req.sender : req.receiver;

  return (
    <div className="max-w-2xl mx-auto w-full animate-in fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white hidden md:block mb-6">
          Follow Requests
        </h1>

        <div className="flex items-center gap-8 border-b border-neutral-800 px-2">
          <button
            onClick={() => setTab("incoming")}
            className={cn(
              "pb-3 text-[15px] font-semibold transition-colors relative",
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
              "pb-3 text-[15px] font-semibold transition-colors relative",
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

      <div className="flex flex-col gap-3 md:gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900/40 rounded-2xl border border-neutral-800 border-dashed">
            <div className="text-neutral-400 text-[15px] font-medium">
              {activeTab === "incoming"
                ? "No pending requests"
                : "No outgoing requests"}
            </div>
            <div className="text-neutral-500 text-sm mt-1.5">
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
                className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-2xl hover:bg-neutral-800/80 transition-colors shadow-sm"
              >
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt={user.username}
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-neutral-700 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[15px] font-semibold text-white truncate">
                      {user.username}
                    </span>
                    {user.bio && (
                      <span className="text-sm text-neutral-400 truncate mt-0.5">
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
                        className="flex items-center justify-center bg-[#0095f6] hover:bg-[#1877f2] active:scale-95 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
                      >
                        <Check size={18} className="mr-1.5 hidden sm:block" />
                        Confirm
                      </button>
                      <button
                        onClick={() => actionRequest(request, "decline")}
                        className="flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
                      >
                        <X size={18} className="mr-1.5 hidden sm:block" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => actionRequest(request, "cancel")}
                      className="flex items-center justify-center bg-neutral-800 hover:bg-red-500/20 active:scale-95 text-neutral-200 hover:text-red-400 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
                    >
                      <UserMinus size={18} className="mr-1.5 hidden sm:block" />
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
