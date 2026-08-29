import { Mail, Globe, Clock, MessageCircle } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import { usePageMeta } from '@/lib/hooks';

export default function Contact() {
  usePageMeta(
    'Contact Zyntiqo — Start Your Project',
    'Tell Zyntiqo what you want to build, grow or automate. Send a project request and our team will respond within one business day.',
  );

  return (
    <section className="relative pt-32 pb-20 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-20" style={{ backgroundSize: '60px 60px' }} />
      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-ink-200">
            <MessageCircle className="h-3.5 w-3.5 text-brand-400" />
            Let's Talk
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Start Your <span className="text-gradient">Project</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-300">
            Share what you're building. We'll reply with the right solution and
            next steps — no pressure, no jargon.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.4fr]">
          {/* Contact info */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/5 bg-ink-850/60 p-8">
              <h2 className="text-lg font-semibold text-white">Reach us directly</h2>
              <div className="mt-6 space-y-5">
                <a
                  href="mailto:wecare@zyntiqo.com"
                  className="group flex items-start gap-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Mail className="h-5 w-5 text-brand-300" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-ink-500">Email</span>
                    <span className="text-sm text-white transition-colors group-hover:text-brand-300">
                      wecare@zyntiqo.com
                    </span>
                  </span>
                </a>
                <a
                  href="https://www.zyntiqo.com"
                  className="group flex items-start gap-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Globe className="h-5 w-5 text-brand-300" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-ink-500">Website</span>
                    <span className="text-sm text-white transition-colors group-hover:text-brand-300">
                      www.zyntiqo.com
                    </span>
                  </span>
                </a>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Clock className="h-5 w-5 text-brand-300" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-ink-500">Response time</span>
                    <span className="text-sm text-white">Within one business day</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-ink-850/60 p-8">
              <h3 className="text-sm font-semibold text-white">What happens next?</h3>
              <ol className="mt-4 space-y-3 text-sm text-ink-300">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-300">1</span>
                  We review your request and goals.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-300">2</span>
                  We send a tailored solution plan.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-300">3</span>
                  We build, launch and grow together.
                </li>
              </ol>
            </div>
          </aside>

          {/* Form */}
          <div className="rounded-2xl border border-white/5 bg-ink-850/60 p-8 sm:p-10">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
