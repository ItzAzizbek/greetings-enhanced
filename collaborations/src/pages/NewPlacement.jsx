import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Button, Card, Input } from '../components/UI.jsx';
import VideoPicker from '../components/VideoPicker.jsx';

const DAILY = Number(import.meta.env.VITE_DAILY_RATE_USD || 20);

function toISODate(d) {
  const z = new Date(d);
  z.setHours(0, 0, 0, 0);
  return z.toISOString().slice(0, 10);
}

const today = toISODate(new Date());
const inWeek = toISODate(new Date(Date.now() + 7 * 86400000));

export default function NewPlacement() {
  const [form, setForm] = useState({
    title: '',
    brand: '',
    contactEmail: '',
    startsAt: today,
    endsAt: inWeek,
  });
  const [videoFile, setVideoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  const days = useMemo(() => {
    const s = new Date(form.startsAt).getTime();
    const e = new Date(form.endsAt).getTime();
    return Math.max(1, Math.ceil((e - s) / 86400000));
  }, [form.startsAt, form.endsAt]);

  const total = days * DAILY;

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !videoFile) {
      setError('Title and video are both required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = {
        title: form.title.trim(),
        brand: form.brand.trim(),
        contactEmail: form.contactEmail.trim(),
        videoFile,
        startsAt: new Date(form.startsAt).getTime(),
        endsAt: new Date(form.endsAt).getTime() + 86400000 - 1,
      };
      const order = await api.submit(body);
      nav(`/checkout/${order.adId}`, {
        state: {
          adId: order.adId,
          title: order.title,
          days: order.days,
          amountCents: order.amountCents,
        },
      });
    } catch (err) {
      setError(err.message || 'Submission failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-10">
        <h1 className="font-display text-3xl">New placement</h1>
        <p className="text-muted mt-1">
          Upload your video, pick the dates, and we'll take you to checkout. After payment, an
          operator reviews the clip before it goes live.
        </p>
      </header>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Placement title"
              placeholder="Spring launch"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              label="Brand"
              placeholder="Your company"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>

          <VideoPicker value={videoFile} onChange={setVideoFile} />

          <Input
            label="Contact email"
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Starts"
              type="date"
              min={today}
              required
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
            <Input
              label="Ends"
              type="date"
              min={form.startsAt}
              required
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>

          <div className="rounded-lg bg-sunken p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Total</div>
              <div className="font-display text-3xl tabular-nums mt-1">${total}</div>
            </div>
            <div className="text-right text-sm text-muted">
              {days} day{days === 1 ? '' : 's'} · ${DAILY}/day
            </div>
          </div>

          {error && <div className="text-[#B85C38] text-sm">{error}</div>}

          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? 'Uploading…' : 'Continue to payment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
