import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { Button, Card, Pill } from '../components/UI.jsx';

const STATUS_COPY = {
  pending_payment: { tone: 'neutral', label: 'awaiting payment' },
  pending_review: { tone: 'neutral', label: 'in review' },
  approved: { tone: 'sage', label: 'live' },
  rejected: { tone: 'warn', label: 'rejected' },
};

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString();
}

export default function Dashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const banner = params.get('status');

  useEffect(() => {
    api
      .mine()
      .then((d) => setSubmissions(d.submissions))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <header className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl">Your placements</h1>
          <p className="text-muted mt-1">Track status from payment to live.</p>
        </div>
        <Link to="/new">
          <Button>New placement</Button>
        </Link>
      </header>

      {banner === 'submitted' && (
        <div className="mb-8 rounded-lg bg-sage-soft border border-sage/30 px-4 py-3 text-sm text-sage-deep">
          Payment recorded. Your placement is in review — we'll email you once it's live.
        </div>
      )}

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-ink font-medium">No placements yet.</div>
          <p className="text-muted text-sm mt-1">Submit your first video to get started.</p>
          <div className="mt-5">
            <Link to="/new">
              <Button>New placement</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <ul className="divide-y divide-line rounded-xl2 border border-line bg-surface">
          {submissions.map((s) => {
            const cfg = STATUS_COPY[s.status] || { tone: 'neutral', label: s.status };
            return (
              <li key={s.id} className="p-5 flex items-center gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{s.title}</div>
                    <Pill tone={cfg.tone}>{cfg.label}</Pill>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {fmtDate(s.startsAt)} → {fmtDate(s.endsAt)} · {s.brand || '—'}
                  </div>
                  {s.reviewNote && (
                    <div className="text-xs text-muted mt-2">Review note: {s.reviewNote}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="tabular-nums">${((s.amountCents || 0) / 100).toFixed(2)}</div>
                  <div className="text-xs text-muted">{s.days} day{s.days === 1 ? '' : 's'}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
