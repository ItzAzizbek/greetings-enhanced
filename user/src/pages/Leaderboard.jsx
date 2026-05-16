import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useUserData } from '../UserContext.jsx';
import { Card } from '../components/UI.jsx';

function Row({ row, rank, mine }) {
  return (
    <li
      className={`flex items-center gap-4 px-5 py-3 transition-colors ${
        mine ? 'bg-sage-soft/60' : ''
      }`}
    >
      <div className="w-6 text-muted text-sm tabular-nums">{rank}</div>
      <div className="h-9 w-9 rounded-full bg-sunken overflow-hidden flex-shrink-0">
        {row.photoUrl ? (
          <img src={row.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted text-sm">
            {row.name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 truncate">
        <span className={mine ? 'font-medium' : ''}>{row.name}</span>
        {mine && <span className="text-muted text-xs ml-2">you</span>}
      </div>
      <div className="text-right">
        <div className="tabular-nums">{row.entries}</div>
        <div className="text-xs text-muted">visits</div>
      </div>
      <div className="text-right hidden sm:block">
        <div className="tabular-nums">{row.streak}</div>
        <div className="text-xs text-muted">streak</div>
      </div>
    </li>
  );
}

export default function Leaderboard() {
  const { data } = useUserData();
  const personaId = data?.persona?.id;
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .leaderboard()
      .then((d) => setBoard(d.leaderboard))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display text-3xl">Leaderboard</h1>
        <p className="text-muted mt-1">Top 25 by total visits.</p>
      </header>

      {error ? (
        <Card className="p-10 text-center text-[#B85C38] text-sm">{error}</Card>
      ) : !board ? (
        <Card className="p-10 text-center text-muted text-sm">Loading…</Card>
      ) : board.length === 0 ? (
        <Card className="p-10 text-center text-muted text-sm">No one on the board yet.</Card>
      ) : (
        <Card>
          <ol>
            {board.map((row, i) => (
              <Row key={row.id} row={row} rank={i + 1} mine={row.id === personaId} />
            ))}
          </ol>
        </Card>
      )}
    </>
  );
}
