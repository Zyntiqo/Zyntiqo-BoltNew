import { MessageSquareQuote } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';

export default function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Testimonials"
          title="What Clients Say"
          description="Real stories from real clients will appear here. Zyntiqo does not publish fabricated reviews."
        />

        <div className="mx-auto mt-16 max-w-2xl">
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-white/10 bg-ink-850/40 p-12 text-center">
            <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-50" />
            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <MessageSquareQuote className="h-7 w-7 text-brand-300" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">
                Client stories coming soon
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-400">
                This space is reserved for genuine client testimonials. Once
                projects launch and partners are ready to share their
                experience, their words will be featured here.
              </p>
              <p className="mt-6 text-xs uppercase tracking-wider text-ink-500">
                No fabricated reviews or fake ratings
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
