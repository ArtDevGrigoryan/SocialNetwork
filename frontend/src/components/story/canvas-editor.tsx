import { MapPin, Disc3, Link as LinkIcon, AtSign } from "lucide-react";
import { useStoryStore } from "../../store/story.store";
import { DraggableOverlay } from "./draggable-overlay";

export const StoryCanvasEditor = () => {
  const store = useStoryStore();

  return (
    <>
      {store.mentions.map((mention) => (
        <DraggableOverlay
          key={mention.id}
          item={mention}
          onUpdate={store.updateMention}
          onRemove={store.removeMention}
        >
          <div className="bg-gradient-to-tr from-fuchsia-600 to-orange-500 text-white px-4 py-1.5 rounded-full font-bold text-[15px] shadow-2xl flex items-center gap-1.5 border border-white/20 pointer-events-none">
            <AtSign size={16} strokeWidth={3} />
            {mention.username}
          </div>
        </DraggableOverlay>
      ))}

      {store.storyLocation && (
        <DraggableOverlay
          item={{ id: "location", ...store.storyLocation }}
          onUpdate={(_, updates) => store.updateLocation(updates)}
          onRemove={() => store.setStoryLocation(null)}
        >
          <div
            data-interactive="true"
            className="bg-white/95 text-black px-5 py-2.5 rounded-xl font-bold text-[16px] shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <MapPin size={20} className="text-[#0095F6]" />
            {store.storyLocation.name}
          </div>
        </DraggableOverlay>
      )}

      {store.linkSticker && (
        <DraggableOverlay
          item={{ id: "link", ...store.linkSticker }}
          onUpdate={(_, updates) =>
            store.setLinkSticker({ ...store.linkSticker!, ...updates })
          }
          onRemove={() => store.setLinkSticker(null)}
        >
          <div
            data-interactive="true"
            className="bg-white/95 text-black px-5 py-2.5 rounded-xl font-bold text-[16px] shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <LinkIcon size={20} className="text-blue-600 shrink-0" />
            <span className="text-blue-600 max-w-[150px] truncate">
              {store.linkSticker.text || store.linkSticker.url}
            </span>
          </div>
        </DraggableOverlay>
      )}

      {store.stickers.map((sticker) => (
        <DraggableOverlay
          key={sticker.id}
          item={sticker}
          onUpdate={store.updateSticker}
          onRemove={store.removeSticker}
        >
          <div className="text-[80px] drop-shadow-2xl leading-none pointer-events-none">
            {sticker.emoji}
          </div>
        </DraggableOverlay>
      ))}

      {store.texts.map((text) => (
        <DraggableOverlay
          key={text.id}
          item={text}
          onUpdate={store.updateText}
          onRemove={store.removeText}
          onEdit={store.setEditingTextId}
        >
          <div
            className="text-4xl md:text-5xl font-bold whitespace-pre-wrap text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] leading-tight px-4 pointer-events-none"
            style={{ color: text.color, fontFamily: text.fontFamily }}
          >
            {text.content}
          </div>
        </DraggableOverlay>
      ))}

      {store.musicWidget &&
        !store.musicWidget.isHidden &&
        store.selectedMusic && (
          <DraggableOverlay
            item={{ id: "music-widget", ...store.musicWidget }}
            onUpdate={(_, updates) =>
              store.setMusicWidget({ ...store.musicWidget!, ...updates })
            }
            onRemove={() =>
              store.setMusicWidget({ ...store.musicWidget!, isHidden: true })
            }
          >
            <div
              data-interactive="true"
              className="bg-black/40 backdrop-blur-xl border border-white/20 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-none"
            >
              <img
                src={store.selectedMusic.coverArt}
                className="w-12 h-12 rounded-xl shadow-md object-cover"
                alt="cover"
              />
              <div className="flex flex-col pr-5 text-left">
                <span className="text-white text-[14px] font-bold leading-tight">
                  {store.selectedMusic.title}
                </span>
                <span className="text-white/70 text-[12px] leading-tight flex items-center gap-1.5 mt-0.5">
                  <Disc3 size={12} className="animate-spin-slow" /> Instagram
                  Music
                </span>
              </div>
            </div>
          </DraggableOverlay>
        )}
    </>
  );
};
