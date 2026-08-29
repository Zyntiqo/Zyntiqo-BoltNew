import SectionHeading from '@/components/ui/SectionHeading';
import { whyZyntiqo } from '@/lib/data';

export default function WhyZyntiqo() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why Zyntiqo"
          title="Why Businesses Choose Zyntiqo"
          description="More than a vendor — a technology partner built to grow with you for the long term."
        />

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyZyntiqo.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group relative rounded-2xl border border-white/5 bg-ink-850/60 p-8 transition-all duration-300 hover:border-brand-400/30 hover:bg-ink-800/60"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-brand-500/15 to-accent-500/10">
                  <Icon className="h-5 w-5 text-brand-300" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
