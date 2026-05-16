import { Link } from 'react-router-dom';
import { Button } from '../components/UI.jsx';
import { useAuth } from '../AuthContext.jsx';

const DAILY = Number(import.meta.env.VITE_DAILY_RATE_USD || 20);

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-lg">Greetings</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            {user ? (
              <Link to="/dashboard">
                <Button variant="ghost">Your placements</Button>
              </Link>
            ) : (
              <Link to="/signin">
                <Button variant="ghost">Sign in</Button>
              </Link>
            )}
            <Link to={user ? '/new' : '/signin?next=/new'}>
              <Button>Place an ad</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-24">
        <div className="max-w-2xl">
          <p className="uppercase tracking-[0.3em] text-xs text-sage-deep mb-6">Collaborations</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight">
            Be on screen during the moments people walk in.
          </h1>
          <p className="text-muted text-lg mt-6 leading-relaxed">
            Greetings Enhanced plays your video on display when visitors arrive. Submit a clip,
            pick the days you want to run, and we'll place it after a quick review.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <Link to={user ? '/new' : '/signin?next=/new'}>
              <Button>Start a placement</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline">See your placements</Button>
            </Link>
          </div>
        </div>

        <section className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: '1 · Upload',
              body: 'Share a video URL up to 30 seconds. Vertical or horizontal — both work.',
            },
            {
              title: '2 · Pay',
              body: `Flat rate of $${DAILY} per day. Quick checkout — only billed for days you run.`,
            },
            {
              title: '3 · Go live',
              body: 'A human reviews your clip, then it joins the loop on your selected dates.',
            },
          ].map((step) => (
            <div key={step.title} className="rounded-xl2 border border-line bg-surface p-6">
              <div className="text-sage-deep text-sm font-medium">{step.title}</div>
              <p className="text-muted text-sm mt-2 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-5xl mx-auto px-8 py-6 text-xs text-muted">
          Greetings Enhanced · placements@greetings.example
        </div>
      </footer>
    </div>
  );
}
