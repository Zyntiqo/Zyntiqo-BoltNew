import { usePageMeta } from '@/lib/hooks';

export default function Privacy() {
  usePageMeta(
    'Privacy Policy — Zyntiqo',
    'How Zyntiqo collects, uses and protects your information.',
  );

  return (
    <section className="pt-32 pb-20 sm:pt-40">
      <div className="container-page max-w-3xl">
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">Privacy Policy</h1>
        <div className="prose prose-invert mt-8 max-w-none text-ink-300">
          <p className="text-sm text-ink-500">Last updated: {new Date().getFullYear()}</p>
          <p>
            This privacy policy describes how Zyntiqo handles information you
            share with us through this website. It is a placeholder and will be
            replaced with a full policy before launch.
          </p>
          <h2 className="mt-8 text-xl font-semibold text-white">Information we collect</h2>
          <p>
            We collect the information you voluntarily provide through our
            contact form — such as your name, business name, email, phone and
            project details.
          </p>
          <h2 className="mt-8 text-xl font-semibold text-white">How we use it</h2>
          <p>
            We use the information you share to respond to your enquiry and
            prepare a relevant solution proposal. We do not sell your data.
          </p>
          <h2 className="mt-8 text-xl font-semibold text-white">Contact</h2>
          <p>
            For privacy questions, email{' '}
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
