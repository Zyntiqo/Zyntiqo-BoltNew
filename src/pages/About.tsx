import { Target, Layers, Cpu, Sparkles, Handshake, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import SectionHeading from '@/components/ui/SectionHeading';
import { usePageMeta } from '@/lib/hooks';

const pillars = [
  {
    title: 'Our Mission',
    description:
      'To help every business — regardless of size — access modern technology, marketing, AI and automation through one trusted partner.',
    icon: Target,
  },
  {
    title: 'What We Do',
    description:
      'We build websites, run marketing, deploy AI agents, automate operations and design brands — all under one roof.',
    icon: Layers,
  },
  {
    title: 'Our Approach',
    description:
      'We start from business goals, not technology. Every solution is designed around what you are trying to achieve.',
    icon: Handshake,
  },
  {
    title: 'Technology & AI',
    description:
      'We use modern tools and AI to build systems that are faster, smarter and more cost-effective for our clients.',
    icon: Cpu,
  },
  {
    title: 'Long-Term Partnership',
    description:
      'Zyntiqo is built to be a long-term technology partner — not a one-time vendor that disappears after launch.',
    icon: Sparkles,
  },
];

export default function About() {
  usePageMeta(
    'About Zyntiqo — Your Digital Business Solutions Partner',
    'Zyntiqo is a modern digital business solutions partner helping businesses use technology, AI, marketing and automation to build, grow and scale.',
  );

  return (
    <>
      <section className="relative pt-32 pb-20 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint opacity-20" style={{ backgroundSize: '60px 60px' }} />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-radial-glow blur-2xl" />
        <div className="container-page relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-ink-200">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              About Zyntiqo
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              A modern partner for your{' '}
              <span className="text-gradient">digital business</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-300">
              Zyntiqo helps businesses use technology, AI, marketing and
              automation to build, grow and scale — all from one trusted
              partner instead of a dozen disconnected vendors.
            </p>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-20">
        <div className="container-page">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="group rounded-2xl border border-white/5 bg-ink-850/60 p-8 transition-all duration-300 hover:border-brand-400/30 hover:bg-ink-800/60"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-brand-500/15 to-accent-500/10">
                    <Icon className="h-6 w-6 text-brand-300" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-white">{p.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-850 to-ink-900 px-6 py-16 text-center sm:px-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Let's build your digital future together.
              </h2>
              <p className="mt-4 text-ink-300">
                Whether you're starting from scratch or scaling something that
                already works, Zyntiqo is ready to help.
              </p>
              <div className="mt-8 flex justify-center">
                <Button to="/contact" size="lg">
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
