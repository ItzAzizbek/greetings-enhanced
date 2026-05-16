import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { Button, Input } from '../components/UI.jsx';

export default function Login() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <img src="/icon.png" alt="" className="h-9 w-9 rounded-md" />
          <div>
            <div className="font-display text-2xl leading-tight">Greetings</div>
            <div className="text-muted text-xs">Admin console</div>
          </div>
        </div>

        <h1 className="text-xl font-medium mb-1">Sign in</h1>
        <p className="text-sm text-muted mb-6">Operators only.</p>

        <div className="space-y-3">
          <Input
            type="email"
            label="Email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            label="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="text-warn text-sm mt-4">{error}</div>}

        <Button type="submit" className="w-full mt-6" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Continue'}
        </Button>
      </form>
    </div>
  );
}
