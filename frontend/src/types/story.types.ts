import type { RefObject } from "react";

export interface IUserMini {
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

export interface LinkSticker {
  url: string;
  text?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface VideoTrim {
  start: number;
  end: number;
  maxDuration: number;
}

export interface MusicWidget {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isHidden: boolean;
}

export interface MentionSticker {
  id: string;
  userId: string;
  username: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface StoryMediaData {
  url: string;
  key?: string;
  type: "image" | "video";
  musicUrl?: string | null;
  musicTitle?: string | null;
  musicCover?: string | null;
  musicStartTime?: number;
  musicDuration?: number;
  backgroundMusic?: string | null;
  isVideoMuted?: boolean;
  musicWidget?: MusicWidget | null;
  thumbnail?: string;
  filter?: string;
  location?: StoryLocation | null;
  linkSticker?: LinkSticker | null;
  transform?: MediaTransform;
  stickers?: Sticker[];
  texts?: StoryText[];
  mentionStickers?: MentionSticker[];
  duration?: number;
  videoStartTime?: number;
  videoDuration?: number;
}

export interface ViewerReaction {
  viewer: IUserMini;
  reaction?: string | null;
  liked?: boolean;
  viewedAt: string;
}

export interface StoryViewer {
  user: string;
  viewedAt: string;
  seen: boolean;
  reaction?: string | null;
  liked?: boolean;
}

export interface IStoryData {
  _id: string;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  viewsCount: number;
  media: StoryMediaData;
  user: IUserMini;
  viewer: { seen: boolean; liked: boolean; reaction?: string | null };
  mentions?: string[];
}

export interface IArchiveStoryData {
  _id: string;
  originalStoryId: string;
  createdAt: string;
  archivedAt: string;
  viewsCount: number;
  media: StoryMediaData;
  reactions?: ViewerReaction[];
  user?: IUserMini;
}

export interface ViewersDrawerProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  viewsCount: number;
  viewers: ViewerReaction[];
  loadingViewers: boolean;
  onDelete?: () => void;
}

export interface ArchiveStoryViewerProps {
  archives: IArchiveStoryData[];
  initialIndex: number;
  onClose: () => void;
  isOwner?: boolean;
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
  setIsHolding?: (val: boolean) => void;
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

export interface StoryViewerProps {
  userId: string;
  onClose: () => void;
  onNextUser?: () => void;
  onPrevUser?: () => void;
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

export interface StoryGroup {
  _id: string;
  user: IUserMini;
  stories: IStoryData[];
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
  setDraftFile: (file: File | null) => void;

  selectedMusic: MusicTrack | null;
  showMusicList: boolean;
  playingMusicId: string | null;
  musicResults: MusicTrack[];
  isSearchingMusic: boolean;
  searchMusic: (query: string) => Promise<void>;
  setSelectedMusic: (music: MusicTrack | null) => void;
  setShowMusicList: (show: boolean) => void;
  setPlayingMusicId: (id: string | null) => void;

  selectedFilter: string;
  musicStartTime: number;
  musicDuration: number;
  isVideoMuted: boolean;
  musicWidget: MusicWidget | null;
  setMusicWidget: (widget: MusicWidget | null) => void;
  setIsVideoMuted: (val: boolean) => void;
  setSelectedFilter: (filter: string) => void;
  setMusicStartTime: (time: number) => void;
  setMusicDuration: (duration: number) => void;

  mediaTransform: MediaTransform;
  setMediaTransform: (updates: Partial<MediaTransform>) => void;
  stickers: Sticker[];
  addSticker: (emoji: string) => void;
  updateSticker: (id: string, updates: Partial<Sticker>) => void;
  removeSticker: (id: string) => void;
  texts: StoryText[];
  addText: (textData: Omit<StoryText, "id">) => void;
  updateText: (id: string, updates: Partial<StoryText>) => void;
  removeText: (id: string) => void;
  storyLocation: StoryLocation | null;
  setStoryLocation: (loc: StoryLocation | null) => void;
  updateLocation: (updates: Partial<StoryLocation>) => void;

  mentions: MentionSticker[];
  addMention: (userId: string, username: string) => void;
  updateMention: (id: string, updates: Partial<MentionSticker>) => void;
  removeMention: (id: string) => void;
  linkSticker: LinkSticker | null;
  setLinkSticker: (link: LinkSticker | null) => void;

  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
  videoTrim: VideoTrim;
  setVideoTrim: (start: number, end: number) => void;
  isDraggingItem: boolean;
  setIsDraggingItem: (val: boolean) => void;
  isUploading: boolean;
  resetDraft: () => void;
  uploadStory: (userId?: string, customFile?: File) => Promise<void>;
  viewingUserId: string | null;
  setViewingUserId: (id: string | null) => void;
}
