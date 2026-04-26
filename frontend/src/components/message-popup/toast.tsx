import toast, { type Toast } from "react-hot-toast";

interface ToastUser {
  _id: string;
  username: string;
  avatar?: string;
}

export const showToast = (user: ToastUser, actionText: string) => {
  toast.custom(
    (t: Toast) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-sm w-full bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 shadow-2xl rounded-2xl pointer-events-auto flex items-center p-3.5 gap-3 transition-all cursor-pointer hover:bg-neutral-800 active:scale-95`}
        onClick={() => {
          toast.dismiss(t.id);
          window.location.href = `/notifications`;
        }}
      >
        <img
          className="h-11 w-11 rounded-full object-cover border border-neutral-700 bg-black shrink-0"
          src={user?.avatar || "/default.png"}
          alt={user?.username}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {user?.username}
          </p>
          <p className="text-[13px] text-neutral-400 line-clamp-1">
            {actionText}
          </p>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: "bottom-left", // Instagram Web-ի պես
      id: `${user._id}-${actionText}`, // Կանխում է նույն ծանուցման սպամը
    },
  );
};
