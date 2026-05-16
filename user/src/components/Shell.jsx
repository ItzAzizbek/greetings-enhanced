import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { Button } from './UI.jsx';

const nav = [
  { to: '/', label: 'Overview', end: true },
  { to: '/history', label: 'History' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/profile', label: 'Profile' },
];

export default function Shell() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="max-w-4xl mx-auto px-8 h-16 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <img src="/icon.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-lg">Greetings</span>
          </Link>

          <nav className="flex items-center gap-1 flex-1 justify-center">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `px-3 h-9 inline-flex items-center rounded-md text-sm transition-colors ${
                    isActive ? 'bg-sage-soft text-sage-deep' : 'text-ink hover:bg-sunken'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm text-muted hidden md:block max-w-[180px] truncate">
              {user?.email}
            </span>
            <Button variant="ghost" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12">
        <Outlet />
      </main>
    </div>
  );
}
