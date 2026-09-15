import { supabase } from './supabase';
import { TABLES } from './tables';

export async function toggleLike(postId: string, voterId: string, currentlyLiked: boolean): Promise<void> {
  if (currentlyLiked) {
    const { error } = await supabase.from(TABLES.likes).delete().eq('post_id', postId).eq('voter_id', voterId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from(TABLES.likes).insert({ post_id: postId, voter_id: voterId });
    if (error) throw error;
  }
}

export async function fetchLikeState(postId: string, userId: string): Promise<{ count: number; likedByMe: boolean }> {
  const { data, error } = await supabase.from(TABLES.likes).select('voter_id').eq('post_id', postId);
  if (error) throw error;
  const rows = (data ?? []) as { voter_id: string }[];
  return { count: rows.length, likedByMe: rows.some((r) => r.voter_id === userId) };
}
