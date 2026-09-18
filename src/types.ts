// Существующие типы TTML Studio
export interface LyricLine {
  id: string;
  text: string;
  startTime: number | null;
  endTime: number | null;
}

export interface TrackInfo {
  title: string;
  artist: string;
  album: string;
}

export type AppMode = 'edit' | 'sync' | 'review';

// Новые типы для кабинета лейбла
export type ReleaseStatus = 'idea' | 'recording' | 'mixing' | 'mastering' | 'artwork' | 'pitching' | 'ready' | 'released' | 'archived';
export type ReleaseType = 'single' | 'ep' | 'album' | 'compilation';
export type LyricStatus = 'draft' | 'syncing' | 'ready' | 'published';
export type UserRole = 'admin' | 'manager' | 'artist' | 'editor' | 'viewer';
export type AssetType = 'cover' | 'photo' | 'video' | 'logo' | 'press_kit' | 'other';

export interface Artist {
  id: string;
  name: string;
  stage_name?: string;
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
  created_at: string;
}

export interface Release {
  id: string;
  user_id?: string;
  title: string;
  artist_id?: string;
  type: ReleaseType;
  status: ReleaseStatus;
  release_date?: string;
  upc?: string;
  cover_url?: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: string;
  release_id?: string;
  artist_id?: string;
  title: string;
  track_number?: number;
  duration?: number;
  bpm?: number;
  key_signature?: string;
  genre?: string;
  mood?: string;
  isrc?: string;
  audio_url?: string;
  file_size?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Lyric {
  id: string;
  track_id?: string;
  user_id?: string;
  raw_text?: string;
  synced_data?: LyricLine[];
  format: string;
  status: LyricStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  release_id?: string;
  user_id?: string;
  title: string;
  description?: string;
  is_completed: boolean;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

export interface MediaAsset {
  id: string;
  user_id?: string;
  release_id?: string;
  artist_id?: string;
  type: AssetType;
  title?: string;
  file_url: string;
  file_size?: number;
  dimensions?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  position?: string;
  created_at: string;
}

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  idea: '💡 Идея',
  recording: '🎙 Запись',
  mixing: '🎚 Сведение',
  mastering: '🔊 Мастеринг',
  artwork: '🎨 Обложка',
  pitching: '📢 Питчинг',
  ready: '✅ Готов',
  released: '🚀 Релиз',
  archived: '📦 Архив',
};

export const RELEASE_STATUS_COLORS: Record<ReleaseStatus, string> = {
  idea: 'from-gray-500/20 to-gray-600/20 border-gray-500/30 text-gray-300',
  recording: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300',
  mixing: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-300',
  mastering: 'from-violet-500/20 to-violet-600/20 border-violet-500/30 text-violet-300',
  artwork: 'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-300',
  pitching: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-300',
  ready: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-300',
  released: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-300',
  archived: 'from-slate-500/20 to-slate-600/20 border-slate-500/30 text-slate-300',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  artist: 'Артист',
  editor: 'Редактор',
  viewer: 'Просмотр',
};
