import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Shell from './components/Shell.jsx';
import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import Activity from './pages/Activity.jsx';
import Playlist from './pages/Playlist.jsx';
import People from './pages/People.jsx';
import Review from './pages/Review.jsx';
import NotAuthorized from './pages/NotAuthorized.jsx';

function Gate({ children }) {
  const { user, isAdmin } = useAuth();
  if (user === undefined) {
    return <div className="min-h-screen grid place-items-center text-muted">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <NotAuthorized />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <Gate>
                <Shell />
              </Gate>
            }
          >
            <Route index element={<Overview />} />
            <Route path="activity" element={<Activity />} />
            <Route path="playlist" element={<Playlist />} />
            <Route path="people" element={<People />} />
            <Route path="review" element={<Review />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
