import { Link } from 'react-router-dom';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-3 ${className}`} aria-label="Zyntiqo home">
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white shadow-sm">
        <img
          src="/763847766_122127840039348257_4387174642212466599_n.jpg"
          alt=""
          className="h-full w-full object-cover object-[50%_18%]"
        />
        <span className="absolute inset-0 bg-brand-400/10 mix-blend-multiply transition-opacity group-hover:opacity-0" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-white">
        Zyntiqo
      </span>
    </Link>
  );
}
