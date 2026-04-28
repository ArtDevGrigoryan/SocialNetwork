import type { RefObject } from "react";

export interface IUser {
  _id: string;
  username: string;
  avatar: string;
  bio?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverArt: string;
  duration?: number;
}

export interface MediaTransform {
  scale: number;
  x: number;
  y: number;
}

export interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface StoryText {
  id: string;
  content: string;
  color: string;
  fontFamily: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface StoryLocation {
  name: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface StoryMediaData {
  url: string;
  key?: string;
  type: "image" | "video";
  backgroundMusic?: string;
  musicUrl?: string;
  musicTitle?: string;
  musicStartTime?: number;
  musicDuration?: number;
  filter?: string;
  location?: StoryLocation | null;
  transform?: MediaTransform;
  stickers?: Sticker[];
  texts?: StoryText[];
  duration?: number;
}

export interface StoryViewer {
  user: string;
  viewedAt: string;
  seen: boolean;
}

export interface Story {
  _id: string;
  user: IUser;
  media: StoryMediaData;
  viewers: StoryViewer[];
  createdAt: string;
  expiresAt: string;
}

export interface StoryGroup {
  _id: string;
  user: IUser;
  stories: Story[];
  hasUnseen: boolean;
  latestUpdate: string;
}

export interface StoryStore {
  otherStories: StoryGroup[];
  loadingFeed: boolean;
  myStoriesCount: number;
  hasUnseenMyStory: boolean;
  fetchFeed: (userId?: string) => Promise<void>;

  isCreateModalOpen: boolean;
  setCreateModalOpen: (isOpen: boolean) => void;

  draftFile: File | null;
  draftPreview: string;
  draftType: "image" | "video";
  selectedMusic: MusicTrack | null;
  showMusicList: boolean;
  playingMusicId: string | null;
  musicResults: MusicTrack[];
  isSearchingMusic: boolean;

  selectedFilter: string;
  musicStartTime: number;
  musicDuration: number;

  mediaTransform: MediaTransform;
  stickers: Sticker[];
  texts: StoryText[];
  storyLocation: StoryLocation | null;

  setDraftFile: (file: File | null) => void;
  setSelectedMusic: (music: MusicTrack | null) => void;
  setShowMusicList: (show: boolean) => void;
  setPlayingMusicId: (id: string | null) => void;
  setSelectedFilter: (filter: string) => void;
  setMusicStartTime: (time: number) => void;
  setMusicDuration: (duration: number) => void;

  setMediaTransform: (updates: Partial<MediaTransform>) => void;
  addSticker: (emoji: string) => void;
  updateSticker: (id: string, updates: Partial<Sticker>) => void;
  removeSticker: (id: string) => void;
  addText: (textData: Omit<StoryText, "id">) => void;
  updateText: (id: string, updates: Partial<StoryText>) => void;
  removeText: (id: string) => void;
  setStoryLocation: (loc: StoryLocation | null) => void;
  updateLocation: (updates: Partial<StoryLocation>) => void;

  searchMusic: (query: string) => Promise<void>;

  isUploading: boolean;
  resetDraft: () => void;
  uploadStory: (userId?: string) => Promise<void>;

  viewingUserId: string | null;
  setViewingUserId: (id: string | null) => void;
}

export interface IStoryData {
  _id: string;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  viewsCount: number;
  media: StoryMediaData;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
  viewer: {
    seen: boolean;
    liked: boolean;
    reaction?: string | null;
  };
}

export interface IArchiveStoryData {
  _id: string;
  originalStoryId: string;
  createdAt: string;
  archivedAt: string;
  viewsCount: number;
  media: StoryMediaData;
}

export interface ViewerReaction {
  viewer: {
    _id: string;
    username: string;
    avatar: string;
  };
  reaction?: string | null;
  liked?: boolean;
  viewedAt: string;
}

export interface ViewersDrawerProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  viewsCount: number;
  viewers: ViewerReaction[];
  loadingViewers: boolean;
  onDelete?: () => void;
}

export interface StoryReplyBoxProps {
  username: string;
  storyId: string;
  targetUserId: string;
  setIsPaused: (val: boolean) => void;
  initialReaction?: string | null;
  initialLiked?: boolean;
  onStateUpdate?: (
    storyId: string,
    reaction: string | null,
    liked: boolean,
  ) => void;
}

export interface StoryViewerProps {
  userId: string;
  onClose: () => void;
  onNextUser?: () => void;
  onPrevUser?: () => void;
}

export interface ArchiveStoryViewerProps {
  archives: IArchiveStoryData[];
  initialIndex: number;
  onClose: () => void;
}

export interface StoryProgressBarProps {
  total: number;
  currentIndex: number;
  progress: number;
}

export interface StoryMediaProps {
  media: StoryMediaData;
  isMuted?: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
  setIsPaused: (val: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
}

export interface StoryHeaderProps {
  avatar?: string;
  username: string;
  timeText: string;
  hasAudio?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onClose: () => void;
}

export interface FloatingReactionsProps {
  reaction?: string | null;
  liked?: boolean;
  storyId: string;
}

export interface Particle {
  id: number;
  type: "like" | "reaction";
  value?: string;
  left: number;
  delay: number;
  size: number;
  duration: number;
  dxMid: number;
  dxEnd: number;
}

export interface DraggableItemData {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface DraggableOverlayProps {
  item: DraggableItemData;
  onUpdate: (id: string, updates: Partial<DraggableItemData>) => void;
  onRemove?: (id: string) => void;
  children: React.ReactNode;
}

export type EditorMode =
  | "none"
  | "music"
  | "filters"
  | "trim"
  | "stickers"
  | "text"
  | "adjust"
  | "location";

export interface EditorProps {
  onClose: () => void;
}

export interface MusicLibraryProps {
  onClose: () => void;
  onSelectMusic: (music: MusicTrack) => void;
}

export interface MusicTrimmerProps {
  onClose: () => void;
  onBackToLibrary: () => void;
}
