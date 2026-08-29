import SectionHeading from '@/components/ui/SectionHeading';
import { steps } from '@/lib/data';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Process"
          title="From Idea to Execution"
          description="A simple, transparent process that takes you from first conversation to launched solution."
        />

        <div className="relative mt-16">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent lg:block" />

          <div className="grid gap-8 lg:grid-cols-4 lg:gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="group relative flex flex-col items-center text-center lg:items-start lg:text-left"
                >
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-ink-850 transition-all duration-300 group-hover:border-brand-400/40 group-hover:shadow-glow">
                    <Icon className="h-9 w-9 text-brand-300" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-accent-500 text-xs font-bold text-ink-950">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
