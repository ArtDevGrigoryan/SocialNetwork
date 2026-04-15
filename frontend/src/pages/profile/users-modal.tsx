import { X } from "lucide-react";
import { Link } from "react-router-dom";

export const UsersModal = ({ isOpen, onClose, title, users, type }: any) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 w-full max-w-[400px] h-[400px] rounded-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <div className="w-8" />
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {users.length > 0 ? (
            users.map((u: any) => {
              const profile = type === "followers" ? u.follower : u.following;
              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between p-2 hover:bg-neutral-800/50 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={profile.avatar || "/default.png"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-sm font-semibold text-white">
                      {profile.username}
                    </span>
                  </div>
                  <Link
                    to={`/profile/${profile._id}`}
                    className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded-lg"
                  >
                    View
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-neutral-500">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersModal;