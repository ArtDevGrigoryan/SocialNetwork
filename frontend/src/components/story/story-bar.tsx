import { useEffect, useState, useRef } from "react";
import { Plus } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import CreateStoryModal from "./add-story-modal";
import StoryViewer from "./story-viewer";

interface StoryUser {
  _id: string;
  username: string;
  avatar?: string;
}

interface StoryGroup {
  _id: string;
  user: StoryUser;
  hasUnseen: boolean;
}

export default function StoryBar() {
  const [otherStories, setOtherStories] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();

  const [myStoriesCount, setMyStoriesCount] = useState(0);
  const [hasUnseenMyStory, setHasUnseenMyStory] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/stories");
      const allGroups: StoryGroup[] = data.payload || [];
      setOtherStories(allGroups.filter((g) => g._id !== user?._id));

      if (user?._id) {
        const { data: myData } = await api.get(`/stories/user/${user._id}`);
        const myStories = myData.payload || [];
        setMyStoriesCount(myStories.length);
        setHasUnseenMyStory(myStories.some((s: any) => !s.viewer?.seen));
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("story:created", fetchData);
    return () => window.removeEventListener("story:created", fetchData);
  }, [user?._id]);

  const handleScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleNextUser = () => {
    const userIds = [];
    if (myStoriesCount > 0 && user) userIds.push(user._id);
    otherStories.forEach((g) => userIds.push(g._id));

    const currentIndex = userIds.indexOf(viewingUserId!);
    if (currentIndex !== -1 && currentIndex < userIds.length - 1) {
      setViewingUserId(userIds[currentIndex + 1]);
    } else {
      setViewingUserId(null);
    }
  };

  const handlePrevUser = () => {
    const userIds = [];
    if (myStoriesCount > 0 && user) userIds.push(user._id);
    otherStories.forEach((g) => userIds.push(g._id));

    const currentIndex = userIds.indexOf(viewingUserId!);
    if (currentIndex > 0) {
      setViewingUserId(userIds[currentIndex - 1]);
    }
  };

  return (
    <>
      <style>{`
        .story-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="w-full bg-black sm:bg-neutral-950 sm:border sm:border-neutral-800 rounded-lg p-4 mb-4">
        <div
          ref={scrollRef}
          onWheel={handleScroll}
          className="flex items-center gap-4 overflow-x-auto story-scroll snap-x"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex flex-col items-center gap-1 shrink-0 snap-start">
            <div
              className={`relative rounded-full cursor-pointer transition-transform hover:scale-[1.02] ${
                myStoriesCount > 0 && hasUnseenMyStory
                  ? "p-[2.5px] bg-gradient-to-tr from-yellow-400 via-rose-500 to-fuchsia-600"
                  : myStoriesCount > 0
                    ? "p-[2.5px] bg-neutral-700"
                    : "p-[2px] border border-neutral-800"
              }`}
              onClick={() => {
                if (myStoriesCount > 0) {
                  setViewingUserId(user?._id || null);
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
            >
              <div
                className={`bg-black rounded-full p-[2px] ${myStoriesCount > 0 ? "w-[60px] h-[60px]" : "w-16 h-16"}`}
              >
                <img
                  src={user?.avatar || "/default-avatar.png"}
                  alt="Your story"
                  className="w-full h-full rounded-full object-cover bg-neutral-800"
                />
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateModalOpen(true);
                }}
                className="absolute bottom-0 right-0 bg-blue-500 rounded-full border-2 border-black p-0.5 flex items-center justify-center cursor-pointer hover:scale-110 transition z-10"
              >
                <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-xs text-neutral-400 truncate w-16 text-center mt-1">
              Your story
            </span>
          </div>

          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  <div className="w-[65px] h-[65px] rounded-full bg-neutral-800 animate-pulse" />
                  <div className="w-12 h-2 bg-neutral-800 animate-pulse rounded mt-1" />
                </div>
              ))
            : otherStories.map((group) => (
                <div
                  key={group._id}
                  className="flex flex-col items-center gap-1 cursor-pointer shrink-0 snap-start transition-transform hover:scale-[1.02]"
                  onClick={() => setViewingUserId(group._id)}
                >
                  <div
                    className={`rounded-full p-[2.5px] ${
                      group.hasUnseen
                        ? "bg-gradient-to-tr from-yellow-400 via-rose-500 to-fuchsia-600"
                        : "bg-neutral-700"
                    }`}
                  >
                    <div className="bg-black rounded-full p-[2px] w-[60px] h-[60px]">
                      <img
                        src={group.user.avatar || "/default-avatar.png"}
                        alt={group.user.username}
                        className="w-full h-full rounded-full object-cover bg-neutral-800"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-neutral-300 truncate w-16 text-center mt-1">
                    {group.user.username}
                  </span>
                </div>
              ))}
        </div>
      </div>

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {viewingUserId && (
        <StoryViewer
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
          onNextUser={handleNextUser}
          onPrevUser={handlePrevUser}
        />
      )}
    </>
  );
}
