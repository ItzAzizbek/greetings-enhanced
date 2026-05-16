import { useAuth } from '../AuthContext.jsx';
import { Button } from '../components/UI.jsx';

export default function NotAuthorized() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="text-center max-w-md">
        <img src="/icon.png" alt="" className="h-10 w-10 rounded-md mx-auto mb-6" />
        <h1 className="font-display text-2xl mb-2">Not authorized</h1>
        <p className="text-muted text-sm mb-8">
          {user?.email} doesn't have admin access. If this is a mistake, ask an operator to add
          your email to the admin allowlist.
        </p>
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
