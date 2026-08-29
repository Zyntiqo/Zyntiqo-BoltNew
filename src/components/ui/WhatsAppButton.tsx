import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl, whatsappMessageFor } from '@/lib/services/whatsapp';
import { siteConfig } from '@/lib/config';
import { track } from '@/lib/services/analytics';

type Props = {
  service?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
};

export default function WhatsAppButton({
  service,
  variant = 'secondary',
  size = 'md',
  label = 'WhatsApp Us',
  className = '',
}: Props) {
  if (!siteConfig.whatsappEnabled) return null;

  const url = buildWhatsAppUrl(whatsappMessageFor(service));

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('whatsapp_click', { service })}
      className={`group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 ${sizeClasses(size)} ${variantClasses(variant)} ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}

function sizeClasses(size: 'sm' | 'md' | 'lg') {
  return {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }[size];
}

function variantClasses(variant: 'primary' | 'secondary' | 'ghost' | 'outline') {
  return {
    primary:
      'bg-gradient-to-r from-accent-500 to-brand-500 text-ink-950 font-semibold shadow-glow hover:shadow-card-hover hover:-translate-y-0.5',
    secondary:
      'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm',
    ghost: 'text-ink-200 hover:text-white hover:bg-white/5',
    outline:
      'text-accent-400 border border-accent-400/30 hover:bg-accent-500/10 hover:border-accent-400/50',
  }[variant];
}
