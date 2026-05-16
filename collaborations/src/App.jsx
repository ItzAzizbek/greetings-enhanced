import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Shell from './components/Shell.jsx';
import Landing from './pages/Landing.jsx';
import Signin from './pages/Signin.jsx';
import NewPlacement from './pages/NewPlacement.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Return from './pages/Return.jsx';
import Pricing from './pages/Pricing.jsx';
import Checkout from './pages/Checkout.jsx';

function Gate({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (user === undefined) {
    return <div className="min-h-screen grid place-items-center text-muted">Loading…</div>;
  }
  if (!user) return <Navigate to={`/signin?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/return" element={<Return />} />
          <Route
            path="/checkout/:adId"
            element={
              <Gate>
                <Checkout />
              </Gate>
            }
          />
          <Route
            element={
              <Gate>
                <Shell />
              </Gate>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new" element={<NewPlacement />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
