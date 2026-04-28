import type { RefObject } from "react";
import type { ArchiveItem } from "../store/archive.store";

// STORE

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverArt?: string;
}

export interface StoryUser {
  _id: string;
  username: string;
  avatar?: string;
}

export interface StoryGroup {
  _id: string;
  user: StoryUser;
  hasUnseen: boolean;
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
  setDraftFile: (file: File | null) => void;
  setSelectedMusic: (music: MusicTrack | null) => void;
  setShowMusicList: (show: boolean) => void;
  setPlayingMusicId: (id: string | null) => void;
  searchMusic: (query: string) => Promise<void>;
  isUploading: boolean;
  resetDraft: () => void;
  uploadStory: (userId?: string) => Promise<void>;
  viewingUserId: string | null;
  setViewingUserId: (id: string | null) => void;
}

// Others

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
export interface IStoryData {
  _id: string;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  viewsCount: number;
  media: {
    url: string;
    key: string;
    backgroundMusic: string;
    type: "image" | "video";
  };
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

export interface StoryViewerProps {
  userId: string;
  onClose: () => void;
  onNextUser?: () => void;
  onPrevUser?: () => void;
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
export interface StoryProgressBarProps {
  total: number;
  currentIndex: number;
  progress: number;
}
export interface StoryMediaProps {
  media: { type: "image" | "video"; url: string };
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
export interface ArchiveStoryViewerProps {
  archives: ArchiveItem[];
  initialIndex: number;
  onClose: () => void;
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
