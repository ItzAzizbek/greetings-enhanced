import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Button, Card, EmptyState, Input, Pill } from '../components/UI.jsx';
import VideoPicker from '../components/VideoPicker.jsx';

function statusTone(s) {
  if (s === 'approved') return 'sage';
  if (s === 'rejected') return 'warn';
  return 'neutral';
}

export default function Playlist() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [error, setError] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const { ads } = await api.listAds();
      setAds(ads);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  function resetForm() {
    setTitle('');
    setVideoFile(null);
    setError(null);
  }

  async function onCreate(e) {
    e.preventDefault();
    if (!title.trim() || !videoFile) {
      setError('Title and video are both required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createAd({ title: title.trim(), videoFile });
      resetForm();
      setCreating(false);
      refresh();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function move(idx, dir) {
    const next = [...ads];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setAds(next);
    await api.reorderAds(next.map((a) => a.id));
  }

  async function remove(id) {
    if (!confirm('Remove this video from the playlist?')) return;
    await api.deleteAd(id);
    refresh();
  }

  async function toggleStatus(ad) {
    const next = ad.status === 'approved' ? 'rejected' : 'approved';
    await api.updateAd(ad.id, { status: next });
    refresh();
  }

  return (
    <div className="max-w-5xl mx-auto px-10 py-12">
      <header className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl">Playlist</h1>
          <p className="text-muted mt-1">Approved videos loop on the display in this order.</p>
        </div>
        <Button
          onClick={() => {
            if (creating) resetForm();
            setCreating((v) => !v);
          }}
        >
          {creating ? 'Cancel' : 'Add video'}
        </Button>
      </header>

      {creating && (
        <Card className="p-6 mb-8">
          <form onSubmit={onCreate} className="space-y-4">
            <Input
              label="Title"
              required
              placeholder="Spring loop · 30s"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <VideoPicker value={videoFile} onChange={setVideoFile} />
            {error && <div className="text-[#B85C38] text-sm">{error}</div>}
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Uploading…' : 'Save'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : ads.length === 0 ? (
        <EmptyState
          title="No videos yet"
          hint="Upload the first video to start the loop."
          action={<Button onClick={() => setCreating(true)}>Add video</Button>}
        />
      ) : (
        <ol className="divide-y divide-line rounded-xl2 border border-line bg-surface">
          {ads.map((ad, i) => (
            <li key={ad.id} className="flex items-center gap-4 p-4">
              <div className="w-8 text-center text-muted tabular-nums">{i + 1}</div>
              <div className="h-12 w-20 rounded-md bg-sunken overflow-hidden flex-shrink-0">
                {ad.videoUrl ? (
                  <video
                    src={ad.videoUrl}
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{ad.title}</span>
                  <Pill tone={statusTone(ad.status)}>{ad.status}</Pill>
                  {ad.source === 'collaboration' && <Pill>collab</Pill>}
                </div>
                <div className="text-xs text-muted truncate mt-0.5">{ad.videoUrl}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </Button>
                <Button variant="ghost" onClick={() => move(i, 1)} disabled={i === ads.length - 1}>
                  ↓
                </Button>
                <Button variant="outline" onClick={() => toggleStatus(ad)}>
                  {ad.status === 'approved' ? 'Pause' : 'Approve'}
                </Button>
                <Button variant="danger" onClick={() => remove(ad.id)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
