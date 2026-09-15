import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Pencil, UserRound, Camera } from 'lucide-react';
import { Container } from '@/lib/ui/Container';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { Input } from '@/lib/ui/Input';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { EmptyState } from '@/lib/ui/EmptyState';
import { fetchProfileByUsername, updateProfile } from '@/lib/profiles';
import { fetchPostsByUsername } from '@/lib/posts';
import { uploadFile } from '@/lib/storage';
import { useAuth } from '@/lib/auth';
import { PostGrid } from '@/components/PostGrid';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState('');

  const profileQuery = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfileByUsername(username!),
    enabled: !!username,
  });

  const postsQuery = useQuery({
    queryKey: ['userPosts', username],
    queryFn: () => fetchPostsByUsername(username!),
    enabled: !!username,
  });

  const isOwn = !!user && !!profileQuery.data && profileQuery.data.owner_id === user.id;

  const saveBio = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not signed in');
      await updateProfile(user.id, { bio: bioDraft.trim() || null });
    },
    onSuccess: async () => {
      setEditing(false);
      await refreshProfile();
      qc.invalidateQueries({ queryKey: ['profile', username] });
    },
  });

  const changeAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not signed in');
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;
      const avatarUrl = await uploadFile(path, file);
      await updateProfile(user.id, { avatar_url: avatarUrl });
    },
    onSuccess: async () => {
      await refreshProfile();
      qc.invalidateQueries({ queryKey: ['profile', username] });
    },
  });

  if (profileQuery.isLoading || postsQuery.isLoading) {
    return (
      <Container className="max-w-2xl">
        <CenteredSpinner label="Loading profile" />
      </Container>
    );
  }

  if (profileQuery.error || postsQuery.error) {
    return (
      <Container className="max-w-2xl">
        <Alert variant="destructive">
          <AlertTitle>Couldn't load this profile</AlertTitle>
          <AlertDescription>
            {((profileQuery.error ?? postsQuery.error) as Error).message}
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  if (!profileQuery.data) {
    return (
      <Container className="max-w-2xl">
        <EmptyState icon={<UserRound size={20} />} title="Profile not found" description="This username doesn't exist." />
      </Container>
    );
  }

  const p = profileQuery.data;

  return (
    <Container className="max-w-2xl">
      <Card className="mb-8">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:text-left">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) changeAvatar.mutate(f);
            }}
          />
          <button
            type="button"
            disabled={!isOwn}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-h2 text-muted-foreground disabled:cursor-default"
          >
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={p.username} className="h-full w-full object-cover" />
            ) : (
              p.username.slice(0, 1).toUpperCase()
            )}
          </button>
          <div className="flex-1 space-y-1">
            <h1 className="text-h1">{p.username}</h1>
            {!editing && (
              <p className="text-body text-muted-foreground">{p.bio || 'No bio yet.'}</p>
            )}
            <p className="text-small text-muted-foreground">
              <span className="tabular-nums font-medium text-foreground">{postsQuery.data?.length ?? 0}</span> posts
            </p>
          </div>
          {isOwn && !editing && (
            <Button size="sm" variant="outline" onClick={() => { setBioDraft(p.bio ?? ''); setEditing(true); }}>
              <Pencil size={16} />
              Edit profile
            </Button>
          )}
        </CardContent>
        {isOwn && editing && (
          <>
            <CardHeader>
              <CardTitle>Edit bio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {saveBio.error && (
                <Alert variant="destructive">
                  <AlertTitle>Couldn't save</AlertTitle>
                  <AlertDescription>{(saveBio.error as Error).message}</AlertDescription>
                </Alert>
              )}
              {changeAvatar.error && (
                <Alert variant="destructive">
                  <AlertTitle>Couldn't update avatar</AlertTitle>
                  <AlertDescription>{(changeAvatar.error as Error).message}</AlertDescription>
                </Alert>
              )}
              <Input placeholder="Tell people about yourself…" value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} />
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm" onClick={() => saveBio.mutate()} disabled={saveBio.isPending}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

      <div className="mb-4 flex items-center gap-2 text-small text-muted-foreground">
        <Camera size={14} />
        Posts
      </div>
      <PostGrid posts={postsQuery.data ?? []} />
    </Container>
  );
}
