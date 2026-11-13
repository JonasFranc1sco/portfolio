import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { Setup2FAPage } from './pages/auth/Setup2FAPage';
import { Verify2FAPage } from './pages/auth/Verify2FAPage';
import { NewPostPage } from './pages/admin/NewPostPage';
import { EditPostPage } from './pages/admin/EditPostPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-primary text-primary">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/posts/:slug" element={<PostDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/login/2fa-setup" element={<Setup2FAPage />} />
                <Route path="/login/2fa-verify" element={<Verify2FAPage />} />
                <Route path="/admin/posts/new" element={<NewPostPage />} />
                <Route path="/admin/posts/:slug/edit" element={<EditPostPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
