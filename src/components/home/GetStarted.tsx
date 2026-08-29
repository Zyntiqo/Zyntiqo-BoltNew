import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import SectionHeading from '@/components/ui/SectionHeading';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import { serviceOptions } from '@/lib/data';
import { track } from '@/lib/services/analytics';
import { siteConfig } from '@/lib/config';

export default function GetStarted() {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;
    track('get_started_click', { service: selected });
    navigate(`/contact?interest=${encodeURIComponent(selected)}`);
  };

  return (
    <section id="get-started" className="relative py-24 sm:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Get Started"
          title="What Can We Build For You?"
          description="Pick what you need right now — we'll guide you to the right solution. Not sure? We'll help you decide."
        />

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {serviceOptions.map((option) => {
              const isActive = selected === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelected(option)}
                  className={`group relative flex items-center justify-center rounded-xl border px-4 py-5 text-center text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-brand-400 bg-brand-500/15 text-white shadow-glow'
                      : 'border-white/10 bg-ink-850/60 text-ink-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-400">
                      <Check className="h-2.5 w-2.5 text-ink-950" />
                    </span>
                  )}
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-8 py-4 text-base font-semibold text-ink-950 shadow-glow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none disabled:pointer-events-none"
            >
              Continue
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <p className="text-xs text-ink-500">
              {selected ? `Selected: ${selected}` : 'Select an option to continue'}
            </p>
            {siteConfig.whatsappEnabled && selected && (
              <WhatsAppButton label="Or chat on WhatsApp" service={selected} size="md" variant="ghost" className="mt-2" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
