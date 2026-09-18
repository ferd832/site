// Types for PLANET MUSIC Label Dashboard

// Release statuses - only 5
export type ReleaseStatus = 'draft' | 'shipped' | 'accepted' | 'rejected' | 'withdrawn';
export type ReleaseType = 'single' | 'ep' | 'album';

// Content rating sliders (0-100)
export interface ContentRating {
  isCover: number;        // 0-100
  isInstrumental: number; // 0-100
  explicitLyrics: number; // 0-100
  drugReferences: number; // 0-100
  aiText: number;         // 0-100
  aiInstrumental: number; // 0-100
}

// Artist with platform links
export interface Artist {
  id: string;
  name: string;
  stageName?: string;
  bio?: string;
  avatarUrl?: string;
  platforms: {
    appleMusic?: string;
    spotify?: string;
    yandexMusic?: string;
    vkMusic?: string;
  };
  createdAt: string;
}

// Author (songwriter)
export interface Author {
  id: string;
  fullName: string;
  role?: string; // composer, lyricist, etc.
}

// Track within a release
export interface Track {
  id: string;
  audioFile?: string;
  audioFileName?: string;
  fileSize?: number;
  duration?: number;
  title: string;
  version?: string;
  genre?: string;
  subgenre?: string;
  previewStart?: number; // seconds - for TikTok, VK etc.
  isrc?: string;
  isrcAssigned?: boolean;
  contentRating: ContentRating;
  artists: string[]; // artist IDs
  authors: Author[];
  lyrics?: string;
  lyricsFile?: string; // LRC/TTML file URL
  lyricsFileName?: string;
  order: number;
}

// Release (album/single/EP)
export interface Release {
  id: string;
  type: ReleaseType;
  status: ReleaseStatus;
  
  // Contract
  contractFile?: string;
  contractFileName?: string;
  
  // Album info
  title: string;
  mainArtists: string[]; // artist IDs
  version?: string;
  genre?: string;
  subgenre?: string;
  label?: string;
  upc?: string;
  upcAssigned?: boolean;
  copyrightNotice?: string; // C-line
  phonographicCopyright?: string; // P-line
  
  // Dates
  releaseDate?: string;
  originalReleaseDate?: string;
  yandexFutureRelease?: boolean;
  
  // Promo
  artistBio?: string;
  promoLinks?: string[];
  promoFiles?: string[];
  
  // Tracks
  tracks: Track[];
  
  createdAt: string;
  updatedAt: string;
}

// Task
export interface Task {
  id: string;
  releaseId?: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

// Lyric (for TTML Studio standalone)
export interface LyricLine {
  id: string;
  text: string;
  startTime: number | null;
  endTime: number | null;
}

export interface Lyric {
  id: string;
  trackId?: string;
  rawText?: string;
  syncedData?: LyricLine[];
  format: string;
  status: 'draft' | 'syncing' | 'ready' | 'published';
  version: number;
  createdAt: string;
  updatedAt: string;
}

// User profile
export type UserRole = 'admin' | 'manager' | 'artist' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  fullName?: string;
  role: UserRole;
  position?: string;
  createdAt: string;
}

// Language
export type Language = 'en' | 'ru';

// Status labels
export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, Record<Language, string>> = {
  draft: { en: 'Draft', ru: 'Черновик' },
  shipped: { en: 'Shipped', ru: 'Отгружен' },
  accepted: { en: 'Accepted', ru: 'Принят' },
  rejected: { en: 'Rejected', ru: 'Отклонён' },
  withdrawn: { en: 'Withdrawn', ru: 'Снят' },
};

export const RELEASE_TYPE_LABELS: Record<ReleaseType, Record<Language, string>> = {
  single: { en: 'Single', ru: 'Сингл' },
  ep: { en: 'EP', ru: 'EP' },
  album: { en: 'Album', ru: 'Альбом' },
};

export const ROLE_LABELS: Record<UserRole, Record<Language, string>> = {
  admin: { en: 'Administrator', ru: 'Администратор' },
  manager: { en: 'Manager', ru: 'Руководитель' },
  artist: { en: 'Artist', ru: 'Исполнитель' },
  editor: { en: 'Editor', ru: 'Редактор' },
  viewer: { en: 'Viewer', ru: 'Наблюдатель' },
};
