import type { RefObject } from "react";
import type { IUser } from "./user.types";

// --- Media & Editor Types ---
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
  thumbnail?: string;
  filter?: string;
  location?: StoryLocation | null;
  transform?: MediaTransform;
  stickers?: Sticker[];
  texts?: StoryText[];
  duration?: number;
}

// --- Story & Archive Types ---
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
  reactions?: ViewerReaction[];
}

// --- UI Component Props ---
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
