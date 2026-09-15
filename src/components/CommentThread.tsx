import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send } from 'lucide-react';
import { Input } from '@/lib/ui/Input';
import { Button } from '@/lib/ui/Button';
import { EmptyState } from '@/lib/ui/EmptyState';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { fetchComments, addComment } from '@/lib/comments';
import { relTime } from '@/lib/time';
import { useAuth } from '@/lib/auth';

export function CommentThread({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error('Not signed in');
      await addComment({ postId, authorId: user.id, authorUsername: profile.username, body: draft });
    },
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) submit.mutate();
        }}
        className="flex gap-2"
      >
        <Input
          placeholder="Add a comment…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={submit.isPending}
        />
        <Button type="submit" size="sm" disabled={submit.isPending || !draft.trim()} aria-label="Post comment">
          <Send size={16} />
        </Button>
      </form>

      {isLoading ? (
        <CenteredSpinner label="Loading comments" />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load comments</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<MessageCircle size={20} />} title="No comments yet" description="Be the first to say something." />
      ) : (
        <ul className="space-y-3">
          {data.map((c) => (
            <li key={c.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-small text-muted-foreground">
                {c.author_username.slice(0, 1).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-small font-medium text-foreground">{c.author_username}</span>
                  <span className="text-micro text-muted-foreground">{relTime(c.created_at)}</span>
                </div>
                <p className="text-body text-foreground">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
