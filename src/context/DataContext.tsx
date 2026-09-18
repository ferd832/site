import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Release, Artist, UserProfile, UserRole } from '../types';
import { generateId } from '../utils';

interface DataContextType {
  releases: Release[];
  artists: Artist[];
  profile: UserProfile;
  isAuthenticated: boolean;
  addRelease: (release: Partial<Release>) => void;
  updateRelease: (id: string, data: Partial<Release>) => void;
  deleteRelease: (id: string) => void;
  addArtist: (artist: Partial<Artist>) => void;
  updateArtist: (id: string, data: Partial<Artist>) => void;
  deleteArtist: (id: string) => void;
  login: (email: string, password: string, role?: UserRole) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  switchRole: (role: UserRole) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
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

  const login = useCallback((email: string, _password: string, role: UserRole = 'admin') => {
    setIsAuthenticated(true);
    setProfile(prev => ({ ...prev, id: generateId(), fullName: email.split('@')[0], role }));
    return true;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...data }));
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setProfile(prev => ({ ...prev, role }));
  }, []);

  return (
    <DataContext.Provider value={{
      releases, artists, profile, isAuthenticated,
      addRelease, updateRelease, deleteRelease,
      addArtist, updateArtist, deleteArtist,
      login, logout, updateProfile, switchRole,
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
