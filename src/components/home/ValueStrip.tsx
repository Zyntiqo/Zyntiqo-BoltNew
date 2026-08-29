import { Check } from 'lucide-react';
import { valuePoints } from '@/lib/data';

export default function ValueStrip() {
  return (
    <section className="relative border-y border-white/5 bg-ink-900/40">
      <div className="container-page py-12">
        <p className="text-center text-sm font-medium uppercase tracking-[0.16em] text-ink-400">
          Everything your business needs to grow digitally.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {valuePoints.map((point) => (
            <div
              key={point}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-200"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/15">
                <Check className="h-3 w-3 text-brand-400" />
              </span>
              {point}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
