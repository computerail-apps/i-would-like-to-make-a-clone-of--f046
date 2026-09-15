import { supabase } from './supabase';
import { TABLES } from './tables';
import type { Comment } from './types';

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from(TABLES.comments)
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Comment[];
}

export async function addComment(input: { postId: string; authorId: string; authorUsername: string; body: string }): Promise<void> {
  const { error } = await supabase.from(TABLES.comments).insert({
    post_id: input.postId,
    author_id: input.authorId,
    author_username: input.authorUsername,
    body: input.body.trim(),
  });
  if (error) throw error;
}
