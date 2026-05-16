import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { Button, Input } from '../components/UI.jsx';

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
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
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password);
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
          <div className="font-display text-2xl leading-tight">Greetings</div>
        </div>

        <h1 className="text-xl font-medium mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-muted mb-6">
          {mode === 'signin'
            ? 'Sign in to see your streak and history.'
            : 'Sign up to claim your persona.'}
        </p>

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
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="text-[#B85C38] text-sm mt-4">{error}</div>}

        <Button type="submit" className="w-full mt-6" disabled={submitting}>
          {submitting ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>

        <button
          type="button"
          className="w-full text-center text-sm text-muted mt-4 hover:text-ink"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin' ? 'Need an account?' : 'Already have one?'}
        </button>
      </form>
    </div>
  );
}
