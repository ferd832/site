import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import type { Release, Artist, UserProfile, UserRole, Lyric } from '../types';
import toast from 'react-hot-toast';

interface DataContextType {
  releases: Release[];
  artists: Artist[];
  lyrics: Lyric[];
  profile: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Auth
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  // Releases
  addRelease: (release: Partial<Release>) => Promise<void>;
  updateRelease: (id: string, data: Partial<Release>) => Promise<void>;
  deleteRelease: (id: string) => Promise<void>;
  // Artists
  addArtist: (artist: Partial<Artist>) => Promise<void>;
  updateArtist: (id: string, data: Partial<Artist>) => Promise<void>;
  deleteArtist: (id: string) => Promise<void>;
  // Lyrics
  addLyric: (lyric: Partial<Lyric>) => Promise<string>;
  updateLyric: (id: string, data: Partial<Lyric>) => Promise<void>;
  deleteLyric: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    fullName: '',
    role: 'artist',
    position: '',
    createdAt: new Date().toISOString(),
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Отслеживание сессии Supabase
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile({
          id: '',
          fullName: '',
          role: 'artist',
          position: '',
          createdAt: new Date().toISOString(),
        });
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Загрузка данных при авторизации
  useEffect(() => {
    if (isAuthenticated) {
      loadReleases();
      loadArtists();
      loadLyrics();
    }
  }, [isAuthenticated]);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setProfile({
        id: data.id,
        fullName: data.full_name || '',
        role: data.role as UserRole,
        position: data.position || '',
        createdAt: data.created_at,
      });
    }
  };

  const loadReleases = async () => {
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading releases:', error);
      return;
    }

    if (data) {
      setReleases(data.map(mapReleaseFromDB));
    }
  };

  const loadArtists = async () => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading artists:', error);
      return;
    }

    if (data) {
      setArtists(data.map(mapArtistFromDB));
    }
  };

  const loadLyrics = async () => {
    const { data, error } = await supabase
      .from('lyrics')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading lyrics:', error);
      return;
    }

    if (data) {
      setLyrics(data.map(mapLyricFromDB));
    }
  };

  // Auth functions
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast.error(error.message);
      return false;
    }

    if (data.user) {
      setIsAuthenticated(true);
      toast.success('Добро пожаловать!');
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setReleases([]);
    setArtists([]);
    setLyrics([]);
    toast.success('Вы вышли из системы');
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: data.fullName,
        position: data.position,
      })
      .eq('id', profile.id);

    if (error) {
      toast.error('Ошибка обновления профиля: ' + error.message);
      return;
    }

    setProfile(prev => ({ ...prev, ...data }));
    toast.success('Профиль обновлён');
  }, [profile.id]);

  // Releases functions
  const addRelease = useCallback(async (releaseData: Partial<Release>) => {
    const dbData = mapReleaseToDB(releaseData);
    
    const { data, error } = await supabase
      .from('releases')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      toast.error('Ошибка сохранения: ' + error.message);
      return;
    }

    if (data) {
      setReleases(prev => [mapReleaseFromDB(data), ...prev]);
      toast.success('Отгрузка создана!');
    }
  }, []);

  const updateRelease = useCallback(async (id: string, data: Partial<Release>) => {
    const dbData = mapReleaseToDB(data);
    
    const { error } = await supabase
      .from('releases')
      .update(dbData)
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления: ' + error.message);
      return;
    }

    setReleases(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    toast.success('Отгрузка обновлена!');
  }, []);

  const deleteRelease = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('releases')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Ошибка удаления: ' + error.message);
      return;
    }

    setReleases(prev => prev.filter(r => r.id !== id));
    toast.success('Отгрузка удалена!');
  }, []);

  // Artists functions
  const addArtist = useCallback(async (artistData: Partial<Artist>) => {
    const dbData = mapArtistToDB(artistData);
    
    const { data, error } = await supabase
      .from('artists')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      toast.error('Ошибка сохранения: ' + error.message);
      return;
    }

    if (data) {
      setArtists(prev => [mapArtistFromDB(data), ...prev]);
      toast.success('Артист добавлен!');
    }
  }, []);

  const updateArtist = useCallback(async (id: string, data: Partial<Artist>) => {
    const dbData = mapArtistToDB(data);
    
    const { error } = await supabase
      .from('artists')
      .update(dbData)
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления: ' + error.message);
      return;
    }

    setArtists(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    toast.success('Артист обновлён!');
  }, []);

  const deleteArtist = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('artists')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Ошибка удаления: ' + error.message);
      return;
    }

    setArtists(prev => prev.filter(a => a.id !== id));
    toast.success('Артист удалён!');
  }, []);

  // Lyrics functions
  const addLyric = useCallback(async (lyricData: Partial<Lyric>): Promise<string> => {
    const dbData = mapLyricToDB(lyricData);
    
    const { data, error } = await supabase
      .from('lyrics')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      toast.error('Ошибка сохранения: ' + error.message);
      return '';
    }

    if (data) {
      setLyrics(prev => [mapLyricFromDB(data), ...prev]);
      toast.success('Текст сохранён!');
      return data.id;
    }

    return '';
  }, []);

  const updateLyric = useCallback(async (id: string, data: Partial<Lyric>) => {
    const dbData = mapLyricToDB(data);
    
    const { error } = await supabase
      .from('lyrics')
      .update(dbData)
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления: ' + error.message);
      return;
    }

    setLyrics(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    toast.success('Текст обновлён!');
  }, []);

  const deleteLyric = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('lyrics')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Ошибка удаления: ' + error.message);
      return;
    }

    setLyrics(prev => prev.filter(l => l.id !== id));
    toast.success('Текст удалён!');
  }, []);

  return (
    <DataContext.Provider value={{
      releases, artists, lyrics, profile, isAuthenticated, isLoading,
      login, logout, updateProfile,
      addRelease, updateRelease, deleteRelease,
      addArtist, updateArtist, deleteArtist,
      addLyric, updateLyric, deleteLyric,
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

// Helper functions for DB mapping
function mapReleaseFromDB(db: any): Release {
  return {
    id: db.id,
    type: db.type,
    status: db.status,
    title: db.title,
    contractFileName: db.contract_file_name,
    coverFileName: db.cover_file_name,
    mainArtists: db.main_artists || [],
    genre: db.genre,
    subgenre: db.subgenre,
    label: db.label,
    upc: db.upc,
    copyrightNotice: db.copyright_notice,
    phonographicCopyright: db.phonographic_copyright,
    releaseDate: db.release_date,
    originalReleaseDate: db.original_release_date,
    yandexFutureRelease: db.yandex_future_release,
    yandexFutureDate: db.yandex_future_date,
    artistBio: db.artist_bio,
    promoLinks: db.promo_links || [],
    tracks: db.tracks || [],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapReleaseToDB(release: Partial<Release>): any {
  return {
    type: release.type,
    status: release.status,
    title: release.title,
    contract_file_name: release.contractFileName,
    cover_file_name: release.coverFileName,
    main_artists: release.mainArtists,
    genre: release.genre,
    subgenre: release.subgenre,
    label: release.label,
    upc: release.upc,
    copyright_notice: release.copyrightNotice,
    phonographic_copyright: release.phonographicCopyright,
    release_date: release.releaseDate,
    original_release_date: release.originalReleaseDate,
    yandex_future_release: release.yandexFutureRelease,
    yandex_future_date: release.yandexFutureDate,
    artist_bio: release.artistBio,
    promo_links: release.promoLinks,
    tracks: release.tracks,
  };
}

function mapArtistFromDB(db: any): Artist {
  return {
    id: db.id,
    name: db.name,
    stageName: db.stage_name,
    bio: db.bio,
    avatarUrl: db.avatar_url,
    platforms: db.platforms || {},
    createdAt: db.created_at,
  };
}

function mapArtistToDB(artist: Partial<Artist>): any {
  return {
    name: artist.name,
    stage_name: artist.stageName,
    bio: artist.bio,
    avatar_url: artist.avatarUrl,
    platforms: artist.platforms,
  };
}

function mapLyricFromDB(db: any): Lyric {
  return {
    id: db.id,
    trackTitle: db.track_title,
    artistName: db.artist_name,
    albumName: db.album_name,
    rawText: db.raw_text,
    syncedData: db.synced_data || [],
    format: db.format,
    status: db.status,
    version: db.version,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapLyricToDB(lyric: Partial<Lyric>): any {
  return {
    track_title: lyric.trackTitle,
    artist_name: lyric.artistName,
    album_name: lyric.albumName,
    raw_text: lyric.rawText,
    synced_data: lyric.syncedData,
    format: lyric.format,
    status: lyric.status,
    version: lyric.version,
  };
}
