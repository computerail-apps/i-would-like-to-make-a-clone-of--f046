import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardFooter } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { relTime } from '@/lib/time';
import { toggleLike } from '@/lib/likes';
import { useAuth } from '@/lib/auth';
import type { FeedPost } from '@/lib/types';
import { cn } from '@/lib/cn';

export function PostCard({ post }: { post: FeedPost }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useState<{ liked: boolean; count: number } | null>(null);

  const liked = optimistic ? optimistic.liked : post.likedByMe;
  const count = optimistic ? optimistic.count : post.likeCount;

  const like = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not signed in');
      await toggleLike(post.id, user.id, liked);
    },
    onMutate: () => {
      setOptimistic({ liked: !liked, count: liked ? count - 1 : count + 1 });
    },
    onError: () => {
      setOptimistic(null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['post', post.id] });
    },
  });

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => navigate(`/profile/${post.author_username}`)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-small text-muted-foreground">
          {post.author_username.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-small font-medium text-foreground">{post.author_username}</span>
          <span className="text-micro text-muted-foreground">{relTime(post.created_at)}</span>
        </div>
      </button>
      <button type="button" onClick={() => navigate(`/post/${post.id}`)} className="block w-full">
        <img src={post.image_url} alt={post.caption ?? 'Post image'} className="aspect-square w-full object-cover" loading="lazy" />
      </button>
      <CardContent className="space-y-2 pt-4">
        {post.caption && <p className="text-body text-foreground">{post.caption}</p>}
      </CardContent>
      <CardFooter className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => like.mutate()}
          disabled={like.isPending}
          aria-label="Like"
          className={cn('gap-1.5', liked && 'text-destructive')}
        >
          <Heart size={16} className={cn(liked && 'fill-current')} />
          <span className="tabular-nums">{count}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/post/${post.id}`)} className="gap-1.5">
          <MessageCircle size={16} />
          <span className="tabular-nums">{post.commentCount}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
