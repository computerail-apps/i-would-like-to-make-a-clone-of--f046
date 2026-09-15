import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Upload as UploadIcon } from 'lucide-react';
import { Container } from '@/lib/ui/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/lib/ui/Card';
import { Input } from '@/lib/ui/Input';
import { Button } from '@/lib/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { uploadFile } from '@/lib/storage';
import { createPost } from '@/lib/posts';
import { useAuth } from '@/lib/auth';

export function UploadPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  const submit = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error('Not signed in');
      if (!file) throw new Error('Choose an image first');
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `posts/${user.id}/${Date.now()}.${ext}`;
      const imageUrl = await uploadFile(path, file);
      await createPost({ authorId: user.id, authorUsername: profile.username, imageUrl, caption });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      navigate('/');
    },
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  return (
    <Container className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-h1">Upload a photo</h1>
        <p className="text-body text-muted-foreground">Share something real with the Snapstream community.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New post</CardTitle>
          <CardDescription>Pick an image and add a caption.</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          <CardContent className="space-y-4">
            {submit.error && (
              <Alert variant="destructive">
                <AlertTitle>Upload failed</AlertTitle>
                <AlertDescription>{(submit.error as Error).message}</AlertDescription>
              </Alert>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

            {preview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="block w-full overflow-hidden rounded-md border border-border"
              >
                <img src={preview} alt="Selected preview" className="aspect-square w-full object-cover" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/40"
              >
                <ImagePlus size={28} />
                <span className="text-small">Click to choose an image</span>
              </button>
            )}

            <Input placeholder="Write a caption…" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={submit.isPending || !file}>
              <UploadIcon size={16} />
              {submit.isPending ? 'Uploading…' : 'Share post'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </Container>
  );
}
