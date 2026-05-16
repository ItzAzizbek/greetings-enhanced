import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { useUserData } from '../UserContext.jsx';
import { Button, Card } from '../components/UI.jsx';

function fmtDate(ts) {
  return new Date(ts).toLocaleString();
}

function Field({ label, value, mono = false }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-line last:border-b-0">
      <div className="text-sm text-muted">{label}</div>
      <div className={`col-span-2 text-sm ${mono ? 'font-mono' : ''} break-all`}>{value}</div>
    </div>
  );
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { data, loading } = useUserData();
  const [copied, setCopied] = useState(false);
  const persona = data?.persona;

  async function copyUid() {
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignored */
    }
  }

  if (loading) return <div className="text-muted text-sm">Loading…</div>;

  return (
    <>
      <header className="mb-10">
        <h1 className="font-display text-3xl">Profile</h1>
        <p className="text-muted mt-1">Your account and how it's connected to the display.</p>
      </header>

      <Card className="mb-6">
        <div className="px-6 py-5 border-b border-line">
          <h2 className="font-medium">Account</h2>
        </div>
        <Field label="Email" value={user.email} />
        <Field label="Account ID" value={user.uid} mono />
        <div className="px-6 py-4 flex items-center gap-3">
          <Button variant="outline" onClick={copyUid}>
            {copied ? 'Copied' : 'Copy account ID'}
          </Button>
          <span className="text-xs text-muted">
            Give this to your operator to be linked to a persona.
          </span>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="px-6 py-5 border-b border-line">
          <h2 className="font-medium">Persona</h2>
        </div>
        {persona ? (
          <>
            <Field label="Name" value={persona.name} />
            <Field label="Greeting" value={persona.greeting || '—'} />
            <Field label="Total visits" value={persona.entries ?? 0} />
            <Field label="Current streak" value={`${persona.streak ?? 0} day(s)`} />
            <Field label="Last seen" value={persona.lastSeen ? fmtDate(persona.lastSeen) : '—'} />
          </>
        ) : (
          <div className="px-6 py-10 text-center text-muted text-sm">
            No persona linked yet. Copy your account ID above and share it with the operator.
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </>
  );
}
