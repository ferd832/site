import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { UserProfile, Release, Track, Artist, Task, Lyric, MediaAsset } from '../types';

export function useSupabase() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    setLoading(false);
  };

  const fetchReleases = useCallback(async () => {
    const { data, error } = await supabase.from('releases').select('*').order('updated_at', { ascending: false });
    return { data: data as Release[] | null, error };
  }, []);

  const fetchTracks = useCallback(async () => {
    const { data, error } = await supabase.from('tracks').select('*').order('created_at', { ascending: false });
    return { data: data as Track[] | null, error };
  }, []);

  const fetchArtists = useCallback(async () => {
    const { data, error } = await supabase.from('artists').select('*').order('created_at', { ascending: false });
    return { data: data as Artist[] | null, error };
  }, []);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    return { data: data as Task[] | null, error };
  }, []);

  const fetchLyrics = useCallback(async () => {
    const { data, error } = await supabase.from('lyrics').select('*').order('updated_at', { ascending: false });
    return { data: data as Lyric[] | null, error };
  }, []);

  const fetchMedia = useCallback(async () => {
    const { data, error } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false });
    return { data: data as MediaAsset[] | null, error };
  }, []);

  return {
    user,
    profile,
    loading,
    fetchReleases,
    fetchTracks,
    fetchArtists,
    fetchTasks,
    fetchLyrics,
    fetchMedia,
    fetchProfile,
  };
}
