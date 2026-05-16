export function Button({ variant = 'primary', className = '', ...rest }) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 h-10 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-sage text-white hover:bg-sage-deep',
    ghost: 'bg-transparent text-ink hover:bg-sunken',
    outline: 'border border-line bg-surface text-ink hover:bg-sunken',
    danger: 'text-warn hover:bg-warn/10',
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
      {error && <div className="text-xs text-warn mt-1">{error}</div>}
    </label>
  );
}

export function Textarea({ label, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <div className="text-sm text-muted mb-1.5">{label}</div>}
      <textarea
        className={`w-full min-h-[88px] rounded-lg border border-line bg-surface px-3 py-2 text-sm placeholder:text-muted/70 focus:border-sage ${className}`}
        {...rest}
      />
    </label>
  );
}

export function Card({ className = '', children }) {
  return (
    <div className={`rounded-xl2 border border-line bg-surface ${className}`}>{children}</div>
  );
}

export function Pill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-sunken text-muted',
    sage: 'bg-sage-soft text-sage-deep',
    warn: 'bg-warn/10 text-warn',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 h-6 text-[11px] tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="rounded-xl2 border border-dashed border-line p-10 text-center">
      <div className="text-ink font-medium">{title}</div>
      {hint && <div className="text-sm text-muted mt-1">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
