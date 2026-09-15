import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { EmptyState } from '@/lib/ui/EmptyState';
import type { Post } from '@/lib/types';

export function PostGrid({ posts }: { posts: Post[] }) {
  const navigate = useNavigate();

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<Camera size={20} />}
        title="No posts yet"
        description="Posts from this user will show up here once they upload."
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => navigate(`/post/${p.id}`)}
          className="aspect-square overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-90"
        >
          <img src={p.image_url} alt={p.caption ?? 'Post'} className="h-full w-full object-cover" loading="lazy" />
        </button>
      ))}
    </div>
  );
}
