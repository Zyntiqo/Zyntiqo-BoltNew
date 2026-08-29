import Hero from '@/components/home/Hero';
import ValueStrip from '@/components/home/ValueStrip';
import Services from '@/components/home/Services';
import Solutions from '@/components/home/Solutions';
import HowItWorks from '@/components/home/HowItWorks';
import GetStarted from '@/components/home/GetStarted';
import WhyZyntiqo from '@/components/home/WhyZyntiqo';
import Portfolio from '@/components/home/Portfolio';
import Testimonials from '@/components/home/Testimonials';
import CTA from '@/components/home/CTA';
import { usePageMeta } from '@/lib/hooks';

export default function Home() {
  usePageMeta(
    'Zyntiqo — Build. Grow. Automate. | Digital Business Solutions',
    'Zyntiqo is one partner for your complete digital business needs — website development, digital marketing, AI agents, business automation and e-commerce solutions.',
  );

  return (
    <>
      <Hero />
      <ValueStrip />
      <Services />
      <Solutions />
      <HowItWorks />
      <GetStarted />
      <WhyZyntiqo />
      <Portfolio />
      <Testimonials />
      <CTA />
    </>
  );
}
