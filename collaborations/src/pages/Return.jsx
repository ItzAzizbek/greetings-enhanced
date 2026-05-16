import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/UI.jsx';

export default function Return() {
  const [params] = useSearchParams();
  const status = params.get('status') || 'success';

  if (status === 'cancelled') {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl mb-2">Payment cancelled</h1>
          <p className="text-muted mb-6">Your placement was not charged.</p>
          <Link to="/new">
            <Button>Try again</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-3xl mb-2">Thank you.</h1>
        <p className="text-muted mb-6">
          Your placement is in review. We'll email you the moment it's approved.
        </p>
        <Link to="/dashboard">
          <Button>View placements</Button>
        </Link>
      </div>
    </div>
  );
}
