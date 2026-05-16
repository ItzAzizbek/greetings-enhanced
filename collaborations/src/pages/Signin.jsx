import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { Button, Input } from '../components/UI.jsx';

export default function Signin() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
      nav(next);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-3 mb-10">
          <img src="/icon.png" alt="" className="h-9 w-9 rounded-md" />
          <div className="font-display text-2xl leading-tight">Greetings</div>
        </Link>

        <h1 className="text-xl font-medium mb-1">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="text-sm text-muted mb-6">For brands placing ads.</p>

        <div className="space-y-3">
          <Input
            type="email"
            label="Work email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            label="Password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="text-[#B85C38] text-sm mt-4">{error}</div>}

        <Button type="submit" className="w-full mt-6" disabled={busy}>
          {busy ? '…' : 'Continue'}
        </Button>

        <button
          type="button"
          className="w-full text-center text-sm text-muted mt-4 hover:text-ink"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
