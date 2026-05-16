import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Button, Card, Input } from '../components/UI.jsx';

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function Checkout() {
  const { adId } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const order = location.state;

  const [form, setForm] = useState({
    name: '',
    card: '4242 4242 4242 4242',
    expiry: '12/29',
    cvc: '123',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!order) {
      // Hard reload lost the order context — bounce back to dashboard.
      const t = setTimeout(() => nav('/dashboard', { replace: true }), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [order, nav]);

  if (!order) return <Navigate to="/dashboard" replace />;

  const total = (order.amountCents / 100).toFixed(2);

  async function onPay(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Cardholder name is required.');
      return;
    }
    if (form.card.replace(/\s/g, '').length < 12) {
      setError('Enter a valid card number.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) {
      setError('Expiry must be in MM/YY format.');
      return;
    }
    if (form.cvc.length < 3) {
      setError('CVC must be at least 3 digits.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Tiny artificial delay so the demo feels like a real charge.
      await new Promise((r) => setTimeout(r, 800));
      await api.mockPay(adId);
      nav('/return?status=success', { replace: true });
    } catch (err) {
      setError(err.message || 'Payment failed.');
      setBusy(false);
    }
  }

  async function onCancel() {
    setBusy(true);
    try {
      await api.cancelPlacement(adId);
    } catch {
      // Even if cancel fails, send the user back — the placement just stays pending.
    }
    nav('/return?status=cancelled', { replace: true });
  }

  return (
    <div className="min-h-screen bg-sunken px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-3 text-sm text-muted">
          <img src="/icon.png" alt="" className="h-6 w-6 rounded" />
          <span>Greetings Enhanced</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-sage-soft text-sage-deep px-2.5 h-6 text-[11px] tracking-wide">
            Demo checkout · no real charge
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6">
          <Card className="p-7">
            <h1 className="font-display text-2xl mb-1">Pay for your placement</h1>
            <p className="text-sm text-muted mb-6">
              This is a mock checkout for demo purposes. No card is charged and no data leaves
              your browser.
            </p>

            <form onSubmit={onPay} className="space-y-4">
              <Input
                label="Cardholder name"
                placeholder="Jane Doe"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Card number"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                value={form.card}
                onChange={(e) => setForm({ ...form, card: formatCardNumber(e.target.value) })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry"
                  placeholder="MM/YY"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                />
                <Input
                  label="CVC"
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  maxLength={4}
                  value={form.cvc}
                  onChange={(e) =>
                    setForm({ ...form, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })
                  }
                />
              </div>

              {error && <div className="text-[#B85C38] text-sm">{error}</div>}

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Processing…' : `Pay $${total}`}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-7 h-fit">
            <div className="text-xs uppercase tracking-[0.18em] text-muted">Order summary</div>
            <div className="mt-4 font-medium">{order.title}</div>
            <div className="text-sm text-muted mt-1">
              {order.days} day{order.days === 1 ? '' : 's'} · placement loop
            </div>

            <div className="my-6 border-t border-line" />

            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Subtotal</span>
              <span className="tabular-nums">${total}</span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-sm text-muted">Tax</span>
              <span className="tabular-nums text-muted">$0.00</span>
            </div>
            <div className="flex items-baseline justify-between mt-4 pt-4 border-t border-line">
              <span className="font-medium">Total</span>
              <span className="font-display text-2xl tabular-nums">${total}</span>
            </div>

            <p className="text-xs text-muted mt-6 leading-relaxed">
              After payment, an operator reviews your clip before it joins the loop on the dates
              you selected.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
