import { usePageMeta } from '@/lib/hooks';

export default function Terms() {
  usePageMeta(
    'Terms of Service — Zyntiqo',
    'The terms governing use of the Zyntiqo website and services.',
  );

  return (
    <section className="pt-32 pb-20 sm:pt-40">
      <div className="container-page max-w-3xl">
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">Terms of Service</h1>
        <div className="prose prose-invert mt-8 max-w-none text-ink-300">
          <p className="text-sm text-ink-500">Last updated: {new Date().getFullYear()}</p>
          <p>
            These terms describe the rules for using the Zyntiqo website. This
            is a placeholder and will be replaced with a full version before
            launch.
          </p>
          <h2 className="mt-8 text-xl font-semibold text-white">Use of the site</h2>
          <p>
            You agree to use this website lawfully and not to misuse any forms,
            content or features.
          </p>
          <h2 className="mt-8 text-xl font-semibold text-white">Services</h2>
          <p>
            Any project engagement is governed by a separate agreement signed
            between you and Zyntiqo.
          </p>
          <h2 className="mt-8 text-xl font-semibold text-white">Contact</h2>
          <p>
            For questions about these terms, email{' '}
            <a href="mailto:wecare@zyntiqo.com" className="text-brand-300 hover:text-brand-200">
              wecare@zyntiqo.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
