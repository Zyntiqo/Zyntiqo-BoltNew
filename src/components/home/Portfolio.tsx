import { ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '@/components/ui/SectionHeading';
import { portfolioItems } from '@/lib/data';

const categories = ['All', 'Websites', 'E-commerce', 'Marketing', 'Branding', 'AI', 'Automation'];

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');
  const visibleItems = activeCategory === 'All'
    ? portfolioItems
    : portfolioItems.filter((item) => item.category === activeCategory);

  return (
    <section id="portfolio" className="relative py-24 sm:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Portfolio"
          title="Work Built to Impress"
          description="A look at the kinds of projects Zyntiqo delivers. Replaceable with real case studies as they land."
        />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Portfolio categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                activeCategory === category
                  ? 'border-brand-400/40 bg-brand-500/10 text-brand-200'
                  : 'border-white/10 text-ink-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {category === 'All' && <SlidersHorizontal className="h-3.5 w-3.5" />}
              {category}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-ink-850/60 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/30"
              >
                {/* Visual placeholder */}
                <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${item.gradient}`}>
                  <div className="absolute inset-0 bg-grid-faint opacity-30" style={{ backgroundSize: '32px 32px' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="h-14 w-14 text-white/30 transition-all duration-300 group-hover:scale-110 group-hover:text-white/50" />
                  </div>
                  <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-ink-950/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-ink-200 backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">
                    {item.description}
                  </p>
                  <Link
                    to={`/contact?interest=${encodeURIComponent(item.category)}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-300 transition-colors hover:text-brand-200"
                  >
                    Discuss a similar project
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
