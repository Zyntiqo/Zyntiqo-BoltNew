import { ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import { services } from '@/lib/data';

export default function Services() {
  return (
    <section id="services" className="relative py-24 sm:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Services"
          title="Everything You Need to Build Your Digital Business"
          description="Seven connected capabilities under one roof — so you can move from idea to execution without juggling multiple vendors."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <article
                key={service.id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-ink-850/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/30 hover:bg-ink-800/70 hover:shadow-card-hover"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-500/5 blur-2xl transition-opacity duration-300 group-hover:bg-brand-500/10" />

                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-brand-500/15 to-accent-500/10">
                    <Icon className="h-6 w-6 text-brand-300" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">
                    {service.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-400">
                    {service.description}
                  </p>
                  <a
                    href="#get-started"
                    aria-label={`Learn more about ${service.name}`}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-300 transition-colors hover:text-brand-200"
                  >
                    Learn More
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
