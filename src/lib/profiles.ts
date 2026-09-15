import { supabase } from './supabase';
import { TABLES } from './tables';
import type { Profile } from './types';

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase.from(TABLES.profiles).select('*').eq('username', username).maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function updateProfile(ownerId: string, patch: Partial<Pick<Profile, 'bio' | 'avatar_url'>>): Promise<Profile> {
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .update(patch)
    .eq('owner_id', ownerId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}
