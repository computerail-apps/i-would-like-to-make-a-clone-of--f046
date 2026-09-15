import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Heart, ArrowLeft, ImageOff } from 'lucide-react';
import { Container } from '@/lib/ui/Container';
import { Card, CardContent, CardHeader } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { EmptyState } from '@/lib/ui/EmptyState';
import { fetchPostById } from '@/lib/posts';
import { fetchLikeState, toggleLike } from '@/lib/likes';
import { relTime } from '@/lib/time';
import { useAuth } from '@/lib/auth';
import { CommentThread } from '@/components/CommentThread';
import { cn } from '@/lib/cn';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useState<{ liked: boolean; count: number } | null>(null);

  const postQuery = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostById(id!),
    enabled: !!id,
  });

  const likeQuery = useQuery({
    queryKey: ['likeState', id, user?.id],
    queryFn: () => fetchLikeState(id!, user!.id),
    enabled: !!id && !!user,
  });

  const liked = optimistic ? optimistic.liked : likeQuery.data?.likedByMe ?? false;
  const count = optimistic ? optimistic.count : likeQuery.data?.count ?? 0;

  const like = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Not signed in');
      await toggleLike(id, user.id, liked);
    },
    onMutate: () => setOptimistic({ liked: !liked, count: liked ? count - 1 : count + 1 }),
    onError: () => setOptimistic(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['likeState', id] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  if (postQuery.isLoading) {
    return (
      <Container className="max-w-xl">
        <CenteredSpinner label="Loading post" />
      </Container>
    );
  }

  if (postQuery.error) {
    return (
      <Container className="max-w-xl">
        <Alert variant="destructive">
          <AlertTitle>Couldn't load this post</AlertTitle>
          <AlertDescription>{(postQuery.error as Error).message}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  if (!postQuery.data) {
    return (
      <Container className="max-w-xl">
        <EmptyState icon={<ImageOff size={20} />} title="Post not found" description="This post may have been removed." />
      </Container>
    );
  }

  const post = postQuery.data;

  return (
    <Container className="max-w-xl">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back
      </Button>
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
        <img src={post.image_url} alt={post.caption ?? 'Post image'} className="aspect-square w-full object-cover" />
        <CardContent className="space-y-4 pt-4">
          {post.caption && <p className="text-body text-foreground">{post.caption}</p>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => like.mutate()}
            disabled={like.isPending || likeQuery.isLoading}
            className={cn('gap-1.5 px-0', liked && 'text-destructive')}
          >
            <Heart size={16} className={cn(liked && 'fill-current')} />
            <span className="tabular-nums">{count}</span>
          </Button>
        </CardContent>
        <CardHeader className="border-t border-border">
          <h2 className="text-h3">Comments</h2>
        </CardHeader>
        <CardContent>
          <CommentThread postId={post.id} />
        </CardContent>
      </Card>
    </Container>
  );
}
