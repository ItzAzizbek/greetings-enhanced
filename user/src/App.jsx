import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import { UserProvider } from './UserContext.jsx';
import Shell from './components/Shell.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import History from './pages/History.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Profile from './pages/Profile.jsx';

function Gate({ children }) {
  const { user } = useAuth();
  if (user === undefined) {
    return <div className="min-h-screen grid place-items-center text-muted">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
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
                <UserProvider>
                  <Shell />
                </UserProvider>
              </Gate>
            }
          >
            <Route index element={<Home />} />
            <Route path="history" element={<History />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
