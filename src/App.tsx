import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Nav, NavLink } from '@/lib/ui/Nav';
import { Button } from '@/lib/ui/Button';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Camera, Home, Upload as UploadIcon, User, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AuthScreen } from '@/components/AuthScreen';
import { FeedPage } from '@/pages/Feed';
import { UploadPage } from '@/pages/Upload';
import { PostDetailPage } from '@/pages/PostDetail';
import { ProfilePage } from '@/pages/Profile';

const queryClient = new QueryClient();

function Shell() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CenteredSpinner label="Loading Snapstream" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen">
      <Nav
        brand={
          <span className="inline-flex items-center gap-2">
            <Camera size={18} />
            Snapstream
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate('/upload')}>
              <UploadIcon size={16} />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => (profile ? navigate(`/profile/${profile.username}`) : null)}
              aria-label="My profile"
            >
              <User size={16} />
            </Button>
            <Button size="sm" variant="ghost" aria-label="Sign out" onClick={() => signOut()}>
              <LogOut size={16} />
            </Button>
          </div>
        }
      >
        <NavLink href="/" active={location.pathname === '/'} onClick={() => navigate('/')}>
          <Home size={14} className="mr-2" />
          Feed
        </NavLink>
        {profile && (
          <NavLink
            href={`/profile/${profile.username}`}
            active={location.pathname === `/profile/${profile.username}`}
            onClick={() => navigate(`/profile/${profile.username}`)}
          >
            <User size={14} className="mr-2" />
            Profile
          </NavLink>
        )}
      </Nav>
      <main className="py-8">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
