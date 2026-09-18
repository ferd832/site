import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Release, Track, Artist, Task, Lyric, UserProfile } from '../types';
import { generateId } from '../utils';

interface DataContextType {
  releases: Release[];
  tracks: Track[];
  artists: Artist[];
  tasks: Task[];
  lyrics: Lyric[];
  profile: UserProfile;
  isAuthenticated: boolean;
  addRelease: (release: Partial<Release>) => void;
  updateRelease: (id: string, data: Partial<Release>) => void;
  deleteRelease: (id: string) => void;
  addTrack: (track: Partial<Track>) => void;
  updateTrack: (id: string, data: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
  addArtist: (artist: Partial<Artist>) => void;
  updateArtist: (id: string, data: Partial<Artist>) => void;
  deleteArtist: (id: string) => void;
  addTask: (task: Partial<Task>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addLyric: (lyric: Partial<Lyric>) => string;
  updateLyric: (id: string, data: Partial<Lyric>) => void;
  deleteLyric: (id: string) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    id: 'demo-user',
    fullName: '',
    role: 'admin',
    position: '',
    createdAt: new Date().toISOString(),
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const addRelease = useCallback((release: Partial<Release>) => {
    const newRelease: Release = {
      id: generateId(),
      type: release.type || 'single',
      status: 'draft',
      title: release.title || 'Untitled',
      mainArtists: release.mainArtists || [],
      tracks: release.tracks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...release,
    } as Release;
    setReleases(prev => [newRelease, ...prev]);
  }, []);

  const updateRelease = useCallback((id: string, data: Partial<Release>) => {
    setReleases(prev => prev.map(r => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r));
  }, []);

  const deleteRelease = useCallback((id: string) => {
    setReleases(prev => prev.filter(r => r.id !== id));
  }, []);

  const addTrack = useCallback((track: Partial<Track>) => {
    const newTrack: Track = {
      id: generateId(),
      title: track.title || 'Untitled',
      contentRating: { isCover: 0, isInstrumental: 0, explicitLyrics: 0, drugReferences: 0, aiText: 0, aiInstrumental: 0 },
      artists: track.artists || [],
      authors: track.authors || [],
      order: track.order || 0,
      createdAt: new Date().toISOString(),
      ...track,
    } as Track;
    setTracks(prev => [newTrack, ...prev]);
  }, []);

  const updateTrack = useCallback((id: string, data: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteTrack = useCallback((id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  }, []);

  const addArtist = useCallback((artist: Partial<Artist>) => {
    const newArtist: Artist = {
      id: generateId(),
      name: artist.name || 'Unknown',
      platforms: artist.platforms || {},
      createdAt: new Date().toISOString(),
      ...artist,
    } as Artist;
    setArtists(prev => [newArtist, ...prev]);
  }, []);

  const updateArtist = useCallback((id: string, data: Partial<Artist>) => {
    setArtists(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteArtist = useCallback((id: string) => {
    setArtists(prev => prev.filter(a => a.id !== id));
  }, []);

  const addTask = useCallback((task: Partial<Task>) => {
    const newTask: Task = {
      id: generateId(),
      title: task.title || 'Untitled',
      isCompleted: false,
      priority: task.priority || 'medium',
      createdAt: new Date().toISOString(),
      ...task,
    } as Task;
    setTasks(prev => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  }, []);

  const addLyric = useCallback((lyric: Partial<Lyric>) => {
    const id = generateId();
    const newLyric: Lyric = {
      id,
      format: lyric.format || 'ttml',
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...lyric,
    } as Lyric;
    setLyrics(prev => [newLyric, ...prev]);
    return id;
  }, []);

  const updateLyric = useCallback((id: string, data: Partial<Lyric>) => {
    setLyrics(prev => prev.map(l => l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l));
  }, []);

  const deleteLyric = useCallback((id: string) => {
    setLyrics(prev => prev.filter(l => l.id !== id));
  }, []);

  const login = useCallback((email: string, _password: string) => {
    setIsAuthenticated(true);
    setProfile(prev => ({ ...prev, id: generateId(), fullName: email.split('@')[0] }));
    return true;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <DataContext.Provider value={{
      releases, tracks, artists, tasks, lyrics, profile, isAuthenticated,
      addRelease, updateRelease, deleteRelease,
      addTrack, updateTrack, deleteTrack,
      addArtist, updateArtist, deleteArtist,
      addTask, updateTask, deleteTask, toggleTask,
      addLyric, updateLyric, deleteLyric,
      login, logout, updateProfile,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
