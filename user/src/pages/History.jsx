import { useMemo } from 'react';
import { useUserData } from '../UserContext.jsx';
import { Card } from '../components/UI.jsx';

function fmtFull(ts) {
  return new Date(ts).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupByDay(entrances) {
  const groups = new Map();
  for (const e of entrances) {
    const key = new Date(e.at).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  return Array.from(groups.entries()).map(([day, items]) => ({ day, items }));
}

export default function History() {
  const { data, loading, error } = useUserData();
  const persona = data?.persona;
  const entrances = data?.recentEntrances ?? [];
  const groups = useMemo(() => groupByDay(entrances), [entrances]);

  if (loading) return <div className="text-muted text-sm">Loading…</div>;
  if (error) return <div className="text-[#B85C38] text-sm">{error}</div>;

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display text-3xl">History</h1>
        <p className="text-muted mt-1">Every time the display welcomed you, in order.</p>
      </header>

      {!persona ? (
        <Card className="p-10 text-center text-muted text-sm">
          No persona linked yet — history will appear once you're set up.
        </Card>
      ) : entrances.length === 0 ? (
        <Card className="p-10 text-center text-muted text-sm">
          No visits yet. Stop by the display and we'll log the first one.
        </Card>
      ) : (
        <Card>
          <ul>
            {groups.map((g) => (
              <li key={g.day} className="border-b border-line last:border-b-0">
                <div className="px-6 pt-5 pb-2 text-xs uppercase tracking-[0.18em] text-muted">
                  {g.day}
                </div>
                <ul className="divide-y divide-line">
                  {g.items.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between px-6 py-3 text-sm"
                    >
                      <span>{fmtFull(e.at)}</span>
                      <span className="text-muted">welcomed</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
