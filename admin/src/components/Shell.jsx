import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { Button } from './UI.jsx';

const nav = [
  { to: '/', label: 'Overview', end: true },
  { to: '/activity', label: 'Activity' },
  { to: '/playlist', label: 'Playlist' },
  { to: '/people', label: 'People' },
  { to: '/review', label: 'Review queue' },
];

export default function Shell() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-line bg-surface px-5 py-7 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <img src="/icon.png" alt="" className="h-8 w-8 rounded-md" />
          <div>
            <div className="font-display text-lg leading-tight">Greetings</div>
            <div className="text-xs text-muted">Admin</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `px-3 h-10 flex items-center rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-sage-soft text-sage-deep' : 'text-ink hover:bg-sunken'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-line">
          <div className="text-xs text-muted mb-2 truncate">{user?.email}</div>
          <Button variant="ghost" className="px-2 -ml-2" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
