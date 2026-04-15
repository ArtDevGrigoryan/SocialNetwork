import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import type { IUser } from "../../types/user.types";

interface IFriendRequest {
  _id: string;
  sender: IUser;
  receiver: IUser;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
}

export default function SearchPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<IUser[]>([]);
  const [requests, setRequests] = useState<IFriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const incomingRequests = useMemo(
    () =>
      requests.filter(
        (request) =>
          request.receiver?._id === currentUser?._id &&
          request.status === "PENDING",
      ),
    [currentUser?._id, requests],
  );

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/friends/requests");
      setRequests(data.payload || []);
    } catch (error) {
      console.error("Failed to fetch friend requests", error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/friends/search", {
          params: { search: query.trim() },
        });
        setUsers(data.payload || []);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  const handleRequestAction = async (
    endpoint: "accept" | "decline" | "cancel",
    receiverId: string,
  ) => {
    setActionId(`${endpoint}-${receiverId}`);
    try {
      await api.patch(`/friends/${endpoint}`, { receiver: receiverId });
      await fetchRequests();
    } catch (error) {
      console.error("Failed to update request state", error);
    } finally {
      setActionId(null);
    }
  };

  const handleFollowToggle = async (target: IUser, isFollowing: boolean) => {
    setActionId(`follow-${target._id}`);
    try {
      await api.post(`/friends/${isFollowing ? "unfollow" : "follow"}/${target._id}`);
      await fetchRequests();
    } catch (error) {
      console.error("Failed to toggle follow state", error);
    } finally {
      setActionId(null);
    }
  };

  const getMyRequestState = (targetUserId: string) => {
    const outgoing = requests.find(
      (request) =>
        request.sender?._id === currentUser?._id &&
        request.receiver?._id === targetUserId,
    );
    if (!outgoing) return "NONE";
    if (outgoing.status === "PENDING") return "PENDING";
    if (outgoing.status === "ACCEPTED") return "FOLLOWING";
    return "NONE";
  };

  return (
    <div className="max-w-[935px] mx-auto w-full px-4 py-4 md:py-8 text-white">
      <div className="rounded-2xl border border-neutral-800 bg-black p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-4">Search users</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by username..."
          className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-600"
        />
      </div>

      {incomingRequests.length > 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-black p-4 md:p-6 mt-4">
          <h2 className="text-lg font-semibold mb-3">Pending requests</h2>
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 p-3"
              >
                <Link
                  to={`/profile/${request.sender?._id}`}
                  className="flex items-center gap-3"
                >
                  <img
                    src={request.sender?.avatar || "/default-avatar.png"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="font-medium">{request.sender?.username}</span>
                </Link>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequestAction("decline", request.sender._id)}
                    disabled={actionId === `decline-${request.sender._id}`}
                    className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleRequestAction("accept", request.sender._id)}
                    disabled={actionId === `accept-${request.sender._id}`}
                    className="px-3 py-1.5 rounded-lg text-sm bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800 bg-black p-4 md:p-6 mt-4">
        <h2 className="text-lg font-semibold mb-3">Results</h2>
        {loading ? <p className="text-neutral-400">Searching...</p> : null}
        {!loading && users.length === 0 ? (
          <p className="text-neutral-500">Type to find users.</p>
        ) : (
          <div className="space-y-3">
            {users
              .filter((item) => item._id !== currentUser?._id)
              .map((item) => {
                const state = getMyRequestState(item._id);
                return (
                  <div
                    key={item._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 p-3"
                  >
                    <Link to={`/profile/${item._id}`} className="flex items-center gap-3">
                      <img
                        src={item.avatar || "/default-avatar.png"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="font-medium">{item.username}</span>
                    </Link>

                    {state === "PENDING" ? (
                      <button
                        onClick={() => handleRequestAction("cancel", item._id)}
                        disabled={actionId === `cancel-${item._id}`}
                        className="px-3 py-1.5 rounded-lg text-sm bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50"
                      >
                        Requested
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleFollowToggle(item, state === "FOLLOWING")
                        }
                        disabled={actionId === `follow-${item._id}`}
                        className={`px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 ${
                          state === "FOLLOWING"
                            ? "bg-neutral-800 hover:bg-neutral-700"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {state === "FOLLOWING" ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

