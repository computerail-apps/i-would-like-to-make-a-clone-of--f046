import { supabase } from './supabase';
import { TABLES } from './tables';
import type { Post, FeedPost } from './types';

export async function fetchFeed(userId: string): Promise<FeedPost[]> {
  const { data: posts, error } = await supabase
    .from(TABLES.posts)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = (posts ?? []) as Post[];
  if (rows.length === 0) return [];

  const ids = rows.map((p) => p.id);
  const [likesRes, commentsRes] = await Promise.all([
    supabase.from(TABLES.likes).select('post_id, voter_id').in('post_id', ids),
    supabase.from(TABLES.comments).select('post_id').in('post_id', ids),
  ]);
  if (likesRes.error) throw likesRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const likeCounts = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const l of (likesRes.data ?? []) as { post_id: string; voter_id: string }[]) {
    likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1);
    if (l.voter_id === userId) likedByMe.add(l.post_id);
  }
  const commentCounts = new Map<string, number>();
  for (const c of (commentsRes.data ?? []) as { post_id: string }[]) {
    commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1);
  }

  return rows.map((p) => ({
    ...p,
    likeCount: likeCounts.get(p.id) ?? 0,
    commentCount: commentCounts.get(p.id) ?? 0,
    likedByMe: likedByMe.has(p.id),
  }));
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase.from(TABLES.posts).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Post) ?? null;
}

export async function fetchPostsByUsername(username: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from(TABLES.posts)
    .select('*')
    .eq('author_username', username)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function createPost(input: {
  authorId: string;
  authorUsername: string;
  imageUrl: string;
  caption: string;
}): Promise<Post> {
  const { data, error } = await supabase
    .from(TABLES.posts)
    .insert({
      author_id: input.authorId,
      author_username: input.authorUsername,
      image_url: input.imageUrl,
      caption: input.caption?.trim() || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Post;
}
