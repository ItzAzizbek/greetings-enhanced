import { Link } from 'react-router-dom';
import { Button } from '../components/UI.jsx';
import { useAuth } from '../AuthContext.jsx';

const DAILY = Number(import.meta.env.VITE_DAILY_RATE_USD || 20);

const tiers = [
  {
    name: 'A few days',
    days: 3,
    description: 'Try it for a long weekend.',
  },
  {
    name: 'A week',
    days: 7,
    description: 'Common starting point for product launches.',
    featured: true,
  },
  {
    name: 'A month',
    days: 30,
    description: 'For ongoing campaigns or evergreen brand presence.',
  },
];

function FaqItem({ q, a }) {
  return (
    <div className="border-b border-line py-6 last:border-b-0">
      <div className="font-medium">{q}</div>
      <p className="text-muted text-sm mt-2 leading-relaxed">{a}</p>
    </div>
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const startLink = user ? '/new' : '/signin?next=/new';

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="font-display text-lg">Greetings</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            {user ? (
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/signin">
                <Button variant="ghost">Sign in</Button>
              </Link>
            )}
            <Link to={startLink}>
              <Button>Place an ad</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-20">
        <section className="max-w-2xl mb-16">
          <p className="uppercase tracking-[0.3em] text-xs text-sage-deep mb-6">Pricing</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight">
            One flat rate. No surprises.
          </h1>
          <p className="text-muted text-lg mt-6 leading-relaxed">
            ${DAILY} per day per placement. Pay only for the days you run. Every clip is reviewed
            by a person before it goes live, included in the price.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-xl2 border bg-surface p-6 flex flex-col ${
                t.featured ? 'border-sage' : 'border-line'
              }`}
            >
              <div className="text-xs uppercase tracking-[0.18em] text-muted">{t.name}</div>
              <div className="mt-3 font-display text-4xl tabular-nums">
                ${t.days * DAILY}
              </div>
              <div className="text-sm text-muted mt-1">
                {t.days} days · ${DAILY}/day
              </div>
              <p className="text-sm text-muted mt-5 leading-relaxed flex-1">{t.description}</p>
              <Link to={startLink} className="mt-6">
                <Button variant={t.featured ? 'primary' : 'outline'} className="w-full">
                  Start
                </Button>
              </Link>
            </div>
          ))}
        </section>

        <section>
          <h2 className="font-display text-3xl mb-8">Frequently asked</h2>
          <div>
            <FaqItem
              q="What format should the video be?"
              a="A direct MP4 link works best. Keep it under 30 seconds and ensure it plays without sound — the display is muted."
            />
            <FaqItem
              q="When does my placement go live?"
              a="As soon as payment clears and an operator reviews the clip — usually within a business day. We email you the moment it's approved."
            />
            <FaqItem
              q="Can I refund or change dates?"
              a="Reach out before review and we can update or cancel. After your clip is live, the schedule is locked in."
            />
            <FaqItem
              q="How is my video shown?"
              a="It joins the curated loop on the display. When the system recognizes someone walking in, your ad pauses politely for the greeting and resumes after."
            />
          </div>
        </section>

        <section className="mt-24 rounded-xl2 border border-line bg-sunken p-10 text-center">
          <h2 className="font-display text-3xl">Ready when you are.</h2>
          <p className="text-muted mt-2 max-w-md mx-auto">
            Place your first ad in under five minutes.
          </p>
          <Link to={startLink} className="inline-block mt-6">
            <Button>Start a placement</Button>
          </Link>
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
