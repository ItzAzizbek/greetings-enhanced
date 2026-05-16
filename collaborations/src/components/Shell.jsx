import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { Button } from './UI.jsx';

export default function Shell() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-lg">Greetings</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 h-9 inline-flex items-center rounded-md text-sm ${
                  isActive ? 'text-sage-deep bg-sage-soft' : 'text-ink hover:bg-sunken'
                }`
              }
            >
              Your placements
            </NavLink>
            <NavLink
              to="/new"
              className={({ isActive }) =>
                `px-3 h-9 inline-flex items-center rounded-md text-sm ${
                  isActive ? 'text-sage-deep bg-sage-soft' : 'text-ink hover:bg-sunken'
                }`
              }
            >
              New placement
            </NavLink>
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                `px-3 h-9 inline-flex items-center rounded-md text-sm ${
                  isActive ? 'text-sage-deep bg-sage-soft' : 'text-ink hover:bg-sunken'
                }`
              }
            >
              Pricing
            </NavLink>
            <span className="mx-3 text-muted text-xs hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" onClick={() => signOut()}>
              Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-8 py-12">
        <Outlet />
      </main>
    </div>
  );
}
