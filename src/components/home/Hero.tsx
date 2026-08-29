import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

const nodes = [
  { label: 'Website', angle: 0 },
  { label: 'Marketing', angle: 60 },
  { label: 'AI', angle: 120 },
  { label: 'Automation', angle: 180 },
  { label: 'E-commerce', angle: 240 },
  { label: 'Branding', angle: 300 },
];

const RADIUS = 42;

export default function Hero() {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20 lg:pt-44 lg:pb-24">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 bg-grid-faint opacity-40 mask-fade-b"
        style={{ backgroundSize: '60px 60px' }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-radial-glow blur-2xl" />

      <div className="container-page relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          {/* Left: Copy */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-ink-200 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              Technology • Marketing • AI • Automation
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Build. Grow. Automate.
              <br />
              <span className="text-gradient">With Zyntiqo.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
              From websites and digital marketing to AI agents and business
              automation, Zyntiqo helps businesses build a stronger digital
              future from one trusted partner.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button to="/contact" size="lg">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button to="/book-consultation" variant="secondary" size="lg">
                Book a Consultation
              </Button>
            </div>
          </div>

          {/* Right: Ecosystem visual */}
          <div className="relative mt-6 flex aspect-square w-full max-w-[26rem] justify-self-center sm:max-w-[30rem] lg:mt-0 lg:max-w-md" aria-label="Zyntiqo ecosystem: website, marketing, AI, automation, e-commerce and branding">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Outer rotating ring */}
              <div className="absolute h-full w-full animate-spin-slow rounded-full border border-dashed border-white/10 motion-reduce:animate-none" />
              <div className="absolute h-[78%] w-[78%] rounded-full border border-white/5" />

              {/* Connecting lines */}
              <svg className="absolute h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                {nodes.map((node) => {
                  const rad = (node.angle * Math.PI) / 180;
                  const x = 50 + Math.cos(rad) * RADIUS;
                  const y = 50 + Math.sin(rad) * RADIUS;
                  return (
                    <line
                      key={node.label}
                      x1="50"
                      y1="50"
                      x2={x}
                      y2={y}
                      className={`ecosystem-line ${activeNode === node.label ? 'is-active' : ''}`}
                      stroke="url(#hero-line)"
                      strokeWidth="0.3"
                      strokeDasharray="1 1.5"
                    />
                  );
                })}
                <defs>
                  <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#22d3ee" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#10b981" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center node */}
              <div className="ecosystem-center relative z-10 flex h-28 w-28 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/20 to-accent-500/10 shadow-glow backdrop-blur-sm">
                <div className="absolute inset-0 animate-pulse-ring rounded-2xl border border-brand-400/40" />
                <span className="font-display text-2xl font-semibold text-gradient">Z</span>
              </div>

              {/* Orbiting nodes */}
              {nodes.map((node, i) => {
                const rad = (node.angle * Math.PI) / 180;
                const x = Math.cos(rad) * RADIUS;
                const y = Math.sin(rad) * RADIUS;
                return (
                  <div
                    key={node.label}
                    className="absolute flex items-center justify-center"
                    onMouseEnter={() => setActiveNode(node.label)}
                    onMouseLeave={() => setActiveNode(null)}
                    style={{
                      left: `${50 + x}%`,
                      top: `${50 + y}%`,
                      transform: 'translate(-50%, -50%)',
                      animation: `float 6s ease-in-out ${i * 0.5}s infinite`,
                      willChange: 'transform',
                    }}
                  >
                    <div className={`ecosystem-node flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-white/10 bg-ink-850/80 shadow-card backdrop-blur-md ${activeNode === node.label ? 'is-active' : ''}`}>
                      <span className="text-[10px] font-medium text-ink-200">
                        {node.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
