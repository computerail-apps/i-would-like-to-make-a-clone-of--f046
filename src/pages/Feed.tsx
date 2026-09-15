import { useQuery } from '@tanstack/react-query';
import { Camera, Upload as UploadIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/lib/ui/Container';
import { Button } from '@/lib/ui/Button';
import { EmptyState } from '@/lib/ui/EmptyState';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { fetchFeed } from '@/lib/posts';
import { useAuth } from '@/lib/auth';
import { PostCard } from '@/components/PostCard';

export function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: () => fetchFeed(user!.id),
    enabled: !!user,
  });

  return (
    <Container className="max-w-xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-h1">Feed</h1>
          <p className="text-body text-muted-foreground">Fresh photos from everyone on Snapstream.</p>
        </div>
        <Button onClick={() => navigate('/upload')} size="sm">
          <UploadIcon size={16} />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </div>

      {isLoading ? (
        <CenteredSpinner label="Loading feed" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load the feed</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()} disabled={isRefetching}>
            Retry
          </Button>
        </Alert>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Camera size={20} />}
          title="No posts yet"
          description="Be the first to share a photo with everyone."
          action={
            <Button size="sm" onClick={() => navigate('/upload')}>
              <UploadIcon size={16} />
              Upload a photo
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {data.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </Container>
  );
}
