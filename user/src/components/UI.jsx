export function Button({ variant = 'primary', className = '', ...rest }) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 h-10 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-sage text-white hover:bg-sage-deep',
    ghost: 'bg-transparent text-ink hover:bg-sunken',
    outline: 'border border-line bg-surface text-ink hover:bg-sunken',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}

export function Input({ label, hint, error, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <div className="text-sm text-muted mb-1.5">{label}</div>}
      <input
        className={`w-full h-10 rounded-lg border border-line bg-surface px-3 text-sm placeholder:text-muted/70 focus:border-sage ${className}`}
        {...rest}
      />
      {hint && !error && <div className="text-xs text-muted mt-1">{hint}</div>}
      {error && <div className="text-xs text-[#B85C38] mt-1">{error}</div>}
    </label>
  );
}

export function Card({ className = '', children }) {
  return <div className={`rounded-xl2 border border-line bg-surface ${className}`}>{children}</div>;
}

export function Stat({ label, value, suffix }) {
  return (
    <Card className="p-6">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="font-display text-5xl tabular-nums">{value}</div>
        {suffix && <div className="text-muted text-sm">{suffix}</div>}
      </div>
    </Card>
  );
}
