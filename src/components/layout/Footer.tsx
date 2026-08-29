import { Link } from 'react-router-dom';
import type { ComponentType } from 'react';
import { Mail, Globe, Calendar, MessageCircle, Instagram, Facebook, Linkedin, Youtube, Twitter } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { siteConfig } from '@/lib/config';

const footerLinks = [
  {
    title: 'Company',
    links: [
      { name: 'Services', to: '/#services' },
      { name: 'Solutions', to: '/#solutions' },
      { name: 'How It Works', to: '/#how-it-works' },
      { name: 'Portfolio', to: '/#portfolio' },
    ],
  },
  {
    title: 'About',
    links: [
      { name: 'About Zyntiqo', to: '/about' },
      { name: 'Contact', to: '/contact' },
      { name: 'Privacy Policy', to: '/privacy' },
      { name: 'Terms', to: '/terms' },
    ],
  },
];

type SocialEntry = {
  key: string;
  label: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
};

const socialEntries: SocialEntry[] = [
  { key: 'facebook', label: 'Facebook', url: siteConfig.socialLinks.facebook, icon: Facebook },
  { key: 'instagram', label: 'Instagram', url: siteConfig.socialLinks.instagram, icon: Instagram },
  { key: 'linkedin', label: 'LinkedIn', url: siteConfig.socialLinks.linkedin, icon: Linkedin },
  { key: 'youtube', label: 'YouTube', url: siteConfig.socialLinks.youtube, icon: Youtube },
  { key: 'x', label: 'X', url: siteConfig.socialLinks.x, icon: Twitter },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    url: siteConfig.whatsappEnabled
      ? `https://wa.me/${siteConfig.whatsappNumber}`
      : '',
    icon: MessageCircle,
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/5 bg-ink-950">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-400">
              Build. Grow. Automate. One partner for your complete digital
              business needs — technology, marketing, AI and automation.
            </p>
            <div className="mt-6 space-y-2">
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-brand-300"
              >
                <Mail className="h-4 w-4" />
                {siteConfig.email}
              </a>
              <a
                href={siteConfig.website}
                className="inline-flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-brand-300"
              >
                <Globe className="h-4 w-4" />
                www.zyntiqo.com
              </a>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Follow Us</p>
              <div className="flex flex-wrap gap-2">
                {socialEntries.map((social) => {
                  const Icon = social.icon;
                  const classes = 'flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-ink-300 transition-all hover:-translate-y-0.5 hover:border-brand-400/30 hover:bg-brand-500/10 hover:text-white hover:shadow-[0_0_18px_-8px_rgba(34,211,238,0.8)]';
                  return social.url ? (
                    <a key={social.key} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label} className={classes}>
                      <Icon className="h-4 w-4" />
                    </a>
                  ) : (
                    <span key={social.key} aria-label={`${social.label} link unavailable`} aria-disabled="true" className={`${classes} cursor-not-allowed opacity-40`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-200">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-400 transition-colors hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-200">
              Get Started
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-brand-300"
                >
                  <Mail className="h-4 w-4" />
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  to="/book-consultation"
                  className="inline-flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-brand-300"
                >
                  <Calendar className="h-4 w-4" />
                  Book a Consultation
                </Link>
              </li>
              {siteConfig.whatsappEnabled && (
                <li>
                  <WhatsAppButton label="WhatsApp Us" size="sm" variant="ghost" className="px-0" />
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} Zyntiqo. All rights reserved.
          </p>
          <p className="text-xs text-ink-500">Build. Grow. Automate.</p>
        </div>
      </div>

      {/* Floating WhatsApp button — positioned to avoid chatbot overlap */}
      {siteConfig.whatsappEnabled && (
        <a
          href={`https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(
            "Hello Zyntiqo, I'd like to talk about my project.",
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 left-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30 transition-transform hover:scale-110"
          aria-label="Chat with Zyntiqo on WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}
    </footer>
  );
}
