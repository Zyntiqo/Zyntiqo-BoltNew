import { Check, ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import { solutions } from '@/lib/data';

export default function Solutions() {
  return (
    <section id="solutions" className="relative py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-20" style={{ backgroundSize: '80px 80px' }} />
      <div className="container-page relative">
        <SectionHeading
          eyebrow="Solutions"
          title="Solutions Built Around Your Business"
          description="Instead of selling individual services, Zyntiqo creates complete solutions matched to where your business is right now."
        />

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {solutions.map((tier) => {
            const Icon = tier.icon;
            return (
              <article
                key={tier.id}
                className={`group relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                  tier.highlight
                    ? 'border-brand-400/40 bg-gradient-to-b from-brand-500/10 to-ink-850/60 shadow-glow'
                    : 'border-white/5 bg-ink-850/60 hover:border-brand-400/30 hover:shadow-card-hover'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-3 py-1 text-[11px] font-semibold text-ink-950">
                    Most Popular
                  </span>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Icon className="h-6 w-6 text-brand-300" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-white">{tier.name}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-brand-300">
                  {tier.tagline}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink-400">
                  {tier.description}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Button to="/contact" variant="outline" size="lg">
            Find the Right Solution
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
