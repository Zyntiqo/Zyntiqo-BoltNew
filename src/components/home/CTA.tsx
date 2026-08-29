import { ArrowRight, MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { siteConfig } from '@/lib/config';

export default function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-850 to-ink-900 px-6 py-16 sm:px-12 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-30" style={{ backgroundSize: '50px 50px' }} />
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              Ready to Build Something Better?
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-300">
              Tell us what you're trying to build, grow or automate. We'll help
              you find the right digital solution.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button to="/contact" size="lg">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button to="/book-consultation" variant="secondary" size="lg">
                Book a Consultation
              </Button>
              {siteConfig.whatsappEnabled && (
                <WhatsAppButton label="Talk to Zyntiqo" size="lg" variant="outline" />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
