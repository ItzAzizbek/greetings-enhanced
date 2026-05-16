import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useUserData } from '../UserContext.jsx';
import { Button, Card, Stat } from '../components/UI.jsx';

function formatDate(ts) {
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function firstName(name) {
  if (!name) return null;
  return name.split(/\s+/)[0];
}

export default function Home() {
  const { user } = useAuth();
  const { data, loading, error } = useUserData();
  const [topLeaders, setTopLeaders] = useState([]);

  useEffect(() => {
    api
      .leaderboard()
      .then((d) => setTopLeaders(d.leaderboard.slice(0, 5)))
      .catch(() => {});
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading…</div>;
  if (error) return <div className="text-[#B85C38] text-sm">{error}</div>;

  const persona = data?.persona;
  const entrances = data?.recentEntrances ?? [];
  const greeting = persona ? `Hello, ${firstName(persona.name)}.` : 'Welcome.';

  return (
    <>
      <h1 className="font-display text-4xl mb-2">{greeting}</h1>
      <p className="text-muted mb-10">
        {persona
          ? "Here's a quick view of your visits."
          : "You're signed in. Once an operator links a persona to your account, your stats appear here."}
      </p>

      {persona ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <Stat label="Total visits" value={persona.entries ?? 0} />
          <Stat label="Current streak" value={persona.streak ?? 0} suffix="days" />
          <Stat label="Last seen" value={persona.lastSeen ? timeAgo(persona.lastSeen) : '—'} />
        </div>
      ) : (
        <Card className="p-6 mb-12">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="font-medium">No persona linked yet</div>
              <p className="text-sm text-muted mt-1 max-w-md">
                Share this account ID with the operator who manages your space so they can link
                you. Your visits will then start showing here.
              </p>
              <div className="text-xs text-muted mt-3">
                Account ID: <span className="tabular-nums text-ink select-all">{user.uid}</span>
              </div>
            </div>
            <Link to="/profile">
              <Button variant="outline">Open profile</Button>
            </Link>
          </div>
        </Card>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <h2 className="font-medium">Recent visits</h2>
            <Link to="/history" className="text-sm text-sage hover:text-sage-deep">
              View all
            </Link>
          </div>
          {entrances.length === 0 ? (
            <div className="p-10 text-center text-muted text-sm">
              {persona ? 'No visits yet.' : 'No persona linked yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {entrances.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span>{formatDate(e.at)}</span>
                  <span className="text-muted">welcomed</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="px-5 py-5 border-b border-line flex items-center justify-between">
            <h2 className="font-medium">Top this month</h2>
            <Link to="/leaderboard" className="text-sm text-sage hover:text-sage-deep">
              Full board
            </Link>
          </div>
          {topLeaders.length === 0 ? (
            <div className="p-10 text-center text-muted text-sm">Nobody yet.</div>
          ) : (
            <ol className="divide-y divide-line">
              {topLeaders.map((row, i) => {
                const mine = row.id === persona?.id;
                return (
                  <li
                    key={row.id}
                    className={`flex items-center gap-3 px-5 py-3 text-sm ${
                      mine ? 'bg-sage-soft/60' : ''
                    }`}
                  >
                    <div className="w-5 text-muted tabular-nums">{i + 1}</div>
                    <div className="flex-1 truncate">
                      {row.name}
                      {mine && <span className="text-muted text-xs ml-2">you</span>}
                    </div>
                    <div className="tabular-nums text-muted">{row.entries}</div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </section>
    </>
  );
}
