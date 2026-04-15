import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import AddStoryModal from "./add-story-modal";

// Ենթադրյալ տիպեր backend-ից եկող տվյալների համար
interface IStoryUser {
  _id: string;
  username: string;
  avatar?: string;
  hasUnseenStory: boolean;
}

export default function StoryBar() {
  const { user } = useAuthStore();
  const [usersWithStories, setUsersWithStories] = useState<IStoryUser[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const { data } = await api.get("/stories?limit=15");
      const mapped = (data.payload || []).map((item: any) => ({
        _id: item.user?._id,
        username: item.user?.username,
        avatar: item.user?.avatar,
        hasUnseenStory: Boolean(item.hasUnseen),
      }));
      setUsersWithStories(mapped);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    const onStoryCreated = () => {
      setLoading(true);
      fetchStories();
    };
    window.addEventListener("story:created", onStoryCreated);
    return () => window.removeEventListener("story:created", onStoryCreated);
  }, []);

  return (
    <>
      <div className="w-full bg-black border-b border-neutral-800 md:border md:border-neutral-800 md:rounded-lg mb-4 p-4">
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 snap-x snap-mandatory">
          {/* 1. Իմ Սթորին (Add Story) */}
          <div
            className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
            onClick={() => setIsAddModalOpen(true)}
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-neutral-800 snap-start">
              <img
                src={user?.avatar || "/default-avatar.png"}
                alt="My Story"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-0.5 border-2 border-black">
                <Plus size={16} className="text-white" />
              </div>
            </div>
            <span className="text-xs text-neutral-400">Ձեր սթորին</span>
          </div>

          {/* 2. Մյուս օգտատերերի սթորիները */}
          {loading
            ? // Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  <div className="w-16 h-16 rounded-full bg-neutral-900 animate-pulse" />
                  <div className="w-12 h-2 bg-neutral-900 rounded animate-pulse" />
                </div>
              ))
            : usersWithStories.map((storyUser) => (
                <div
                  key={storyUser._id}
                  className="flex flex-col items-center gap-1 cursor-pointer shrink-0 snap-start"
                >
                  <div
                    className={`p-[2px] rounded-full transition-transform duration-200 hover:scale-[1.03] ${storyUser.hasUnseenStory ? "bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]" : "bg-neutral-800"}`}
                  >
                    <div className="w-[60px] h-[60px] rounded-full bg-black p-[2px]">
                      <img
                        src={storyUser.avatar || "/default-avatar.png"}
                        alt={storyUser.username}
                        className="w-full h-full rounded-full object-cover border border-black"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-white truncate w-16 text-center">
                    {storyUser.username}
                  </span>
                </div>
              ))}
        </div>
      </div>

      <AddStoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}
