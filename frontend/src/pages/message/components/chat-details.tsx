import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, Link2 } from "lucide-react";
import { api } from "../../../lib/axios.config";
import type {
  ChatActiveTab,
  ChatDetailsProps,
  ISharedContentPayload,
  IViewerData,
} from "../types";
import MediaViewer from "./media-viewer";

export default function ChatDetails({
  chatId,
  onClose,
  activeUser,
}: ChatDetailsProps) {
  const [activeTab, setActiveTab] = useState<ChatActiveTab>("media");
  const [data, setData] = useState<ISharedContentPayload>({
    media: [],
    links: [],
    shared: [],
  });
  const [loading, setLoading] = useState(true);

  const [viewerData, setViewerData] = useState<IViewerData | null>(null);

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const { data: resData } = await api.get(`/messages/${chatId}/shared`);
        setData(resData.payload);
      } catch (error) {
        console.error("Failed to load shared content", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSharedData();
  }, [chatId]);

  const handleOpenMedia = (index: number) => {
    const items = data.media.map((m) => ({
      url: m.url,
      mediaType: m.type === "VIDEO" ? "VIDEO" : "IMAGE",
    }));
    setViewerData({ items, initialIndex: index } as IViewerData);
  };

  const handleOpenShared = (index: number) => {
    const items = data.shared
      .filter((s: any) => s.sharedPost?.images?.[0])
      .map((s: any) => ({
        url: s.sharedPost.images[0],
        mediaType: "IMAGE",
      }));
    setViewerData({ items, initialIndex: index } as IViewerData);
  };

  return (
    <>
      <div className="absolute inset-0 z-40 bg-black flex flex-col animate-in slide-in-from-right-2 duration-200">
        <div className="h-[75px] px-4 border-b border-neutral-800 flex items-center shrink-0">
          <button
            onClick={onClose}
            className="p-2 mr-2 hover:bg-neutral-800 rounded-full transition"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
          <h2 className="text-white text-lg font-semibold">Details</h2>
        </div>

        <div className="p-6 flex flex-col items-center border-b border-neutral-800 shrink-0">
          <img
            src={activeUser?.avatar || "/default-avatar.png"}
            className="w-24 h-24 rounded-full object-cover mb-4 border border-neutral-800"
            alt={activeUser?.username}
          />
          <h3 className="text-white font-bold text-[20px]">
            {activeUser?.username}
          </h3>
        </div>

        <div className="flex border-b border-neutral-800 shrink-0">
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 py-3.5 text-[15px] font-semibold transition ${
              activeTab === "media"
                ? "text-white border-b border-white"
                : "text-neutral-500"
            }`}
          >
            Media
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={`flex-1 py-3.5 text-[15px] font-semibold transition ${
              activeTab === "shared"
                ? "text-white border-b border-white"
                : "text-neutral-500"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`flex-1 py-3.5 text-[15px] font-semibold transition ${
              activeTab === "links"
                ? "text-white border-b border-white"
                : "text-neutral-500"
            }`}
          >
            Links
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              {activeTab === "media" && (
                <div className="grid grid-cols-3 gap-0.5">
                  {data.media.map((item: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => handleOpenMedia(i)}
                      className="aspect-square bg-neutral-900 overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      {item.type === "VIDEO" ? (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      ) : (
                        <img
                          src={item.url}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {data.media.length === 0 && (
                    <p className="text-neutral-500 col-span-3 text-center mt-10 text-sm">
                      No shared media
                    </p>
                  )}
                </div>
              )}

              {activeTab === "shared" && (
                <div className="grid grid-cols-3 gap-0.5">
                  {data.shared.map((item: any, i: number) =>
                    item.sharedPost?.images?.[0] ? (
                      <div
                        key={i}
                        onClick={() => handleOpenShared(i)}
                        className="aspect-square bg-neutral-900 overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={item.sharedPost.images[0]}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null,
                  )}
                  {data.shared.length === 0 && (
                    <p className="text-neutral-500 col-span-3 text-center mt-10 text-sm">
                      No shared posts
                    </p>
                  )}
                </div>
              )}

              {activeTab === "links" && (
                <div className="flex flex-col gap-2 p-2">
                  {data.links.map((link: any, i: number) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-4 p-3 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                      <div className="p-3.5 bg-neutral-800 rounded-full shrink-0">
                        <Link2 size={20} className="text-white" />
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <p className="text-blue-400 text-[15px] truncate font-medium">
                          {link.url}
                        </p>
                        <p className="text-neutral-500 text-[13px] truncate mt-0.5">
                          {link.text}
                        </p>
                      </div>
                    </a>
                  ))}
                  {data.links.length === 0 && (
                    <p className="text-neutral-500 text-center mt-8 text-sm">
                      No shared links
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {viewerData && (
        <MediaViewer
          isOpen={true}
          media={viewerData.items}
          initialIndex={viewerData.initialIndex}
          onClose={() => setViewerData(null)}
        />
      )}
    </>
  );
}
