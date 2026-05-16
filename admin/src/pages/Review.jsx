import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, EmptyState, Pill, Textarea } from '../components/UI.jsx';

function formatRange(startsAt, endsAt) {
  if (!startsAt) return '—';
  const s = new Date(startsAt).toLocaleDateString();
  const e = endsAt ? new Date(endsAt).toLocaleDateString() : '—';
  return `${s} → ${e}`;
}

export default function Review() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  async function refresh() {
    setLoading(true);
    try {
      const { queue } = await api.collabQueue();
      setQueue(queue);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  async function decide(id, decision) {
    await api.reviewAd(id, { decision, note: notes[id] || null });
    refresh();
  }

  if (loading) return <div className="px-10 py-12 text-muted text-sm">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-10 py-12">
      <header className="mb-10">
        <h1 className="font-display text-3xl">Review queue</h1>
        <p className="text-muted mt-1">Paid collaboration submissions waiting for approval.</p>
      </header>

      {queue.length === 0 ? (
        <EmptyState title="All clear" hint="No submissions need review right now." />
      ) : (
        <div className="space-y-5">
          {queue.map((ad) => (
            <Card key={ad.id} className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium truncate">{ad.title}</h2>
                    <Pill tone="sage">paid</Pill>
                  </div>
                  <div className="text-sm text-muted mt-1">
                    {ad.brand || '—'} · {ad.contactEmail || '—'}
                  </div>
                  <div className="text-xs text-muted mt-2">{formatRange(ad.startsAt, ad.endsAt)}</div>
                  <a
                    href={ad.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sage hover:text-sage-deep text-sm mt-3 inline-block"
                  >
                    Preview video ↗
                  </a>
                </div>
                <div className="text-right text-sm text-muted">
                  <div>${((ad.amountCents || 0) / 100).toFixed(2)}</div>
                  <div className="text-xs">{ad.days} day{ad.days === 1 ? '' : 's'}</div>
                </div>
              </div>

              <Textarea
                className="mt-4"
                label="Review note (optional)"
                value={notes[ad.id] || ''}
                onChange={(e) => setNotes({ ...notes, [ad.id]: e.target.value })}
              />

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => decide(ad.id, 'rejected')}>
                  Reject
                </Button>
                <Button onClick={() => decide(ad.id, 'approved')}>Approve & schedule</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
