import {
  Globe,
  Megaphone,
  Bot,
  Workflow,
  ShoppingBag,
  Palette,
  Rocket,
  TrendingUp,
  Cpu,
  Layers,
  Handshake,
  Target,
  Sparkles,
  ShieldCheck,
  Infinity as InfinityIcon,
  Lightbulb,
  ClipboardList,
  Hammer,
  LineChart,
  Code,
  ShoppingBag as Shop,
  Brush,
  Bot as AiBot,
  Workflow as Auto,
  Megaphone as Mega,
  Code2,
} from 'lucide-react';

import type { ServiceItem, SolutionTier, StepItem, PortfolioItem } from './types';

export const services: ServiceItem[] = [
  {
    id: 'website',
    name: 'Website Development',
    description:
      'Business websites, landing pages, e-commerce stores and custom web applications.',
    icon: Globe,
  },
  {
    id: 'marketing',
    name: 'Digital Marketing',
    description:
      'Performance marketing, social media, advertising strategy, content and growth campaigns.',
    icon: Megaphone,
  },
  {
    id: 'ai-agents',
    name: 'AI Agents',
    description:
      'AI-powered customer support, sales assistants, business assistants and workflow agents.',
    icon: Bot,
  },
  {
    id: 'automation',
    name: 'Business Automation',
    description:
      'Automate repetitive processes, lead management, customer workflows and internal operations.',
    icon: Workflow,
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Solutions',
    description:
      'Online stores, product catalogs, checkout systems, integrations and growth solutions.',
    icon: ShoppingBag,
  },
  {
    id: 'branding',
    name: 'Branding & Creative',
    description:
      'Brand identity, visual design, social creatives, marketing assets and digital branding.',
    icon: Palette,
  },
  {
    id: 'custom-software',
    name: 'Custom Software',
    description:
      'Purpose-built internal tools, customer portals and connected systems for the way you work.',
    icon: Code2,
  },
];

export const solutions: SolutionTier[] = [
  {
    id: 'launch',
    name: 'Launch',
    tagline: 'Starting your digital journey',
    description:
      'For businesses beginning their digital presence from the ground up.',
    features: ['Website', 'Branding', 'Social presence', 'Basic marketing setup'],
    icon: Rocket,
  },
  {
    id: 'grow',
    name: 'Grow',
    tagline: 'More customers, more reach',
    description:
      'For businesses with an existing presence looking to accelerate growth.',
    features: ['Digital marketing', 'SEO', 'Performance advertising', 'Conversion optimization'],
    icon: TrendingUp,
    highlight: true,
  },
  {
    id: 'automate',
    name: 'Automate',
    tagline: 'Save time, reduce manual work',
    description:
      'For businesses that want to eliminate repetitive tasks and streamline operations.',
    features: ['AI agents', 'Lead automation', 'Customer workflows', 'Business automation'],
    highlight: true,
    icon: Cpu,
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: 'Advanced technology for growth',
    description:
      'For growing companies that need advanced systems and scalable infrastructure.',
    features: ['Custom applications', 'E-commerce', 'Advanced integrations', 'AI systems & scalable infrastructure'],
    icon: Layers,
  },
];

export const steps: StepItem[] = [
  {
    number: '01',
    title: 'Tell Us What You Need',
    description: 'Share your business goals and requirements with our team.',
    icon: Lightbulb,
  },
  {
    number: '02',
    title: 'Get a Solution Plan',
    description: 'We understand your needs and recommend the right solution.',
    icon: ClipboardList,
  },
  {
    number: '03',
    title: 'We Build & Execute',
    description: 'Our team develops, designs and implements the solution.',
    icon: Hammer,
  },
  {
    number: '04',
    title: 'Launch & Grow',
    description: 'Launch your solution and continue improving with Zyntiqo.',
    icon: LineChart,
  },
];

export const whyZyntiqo = [
  {
    title: 'One Partner',
    description: 'Get multiple digital solutions from one team.',
    icon: Handshake,
  },
  {
    title: 'Business First',
    description: 'Solutions designed around business goals, not just technology.',
    icon: Target,
  },
  {
    title: 'AI-Powered',
    description: 'Modern AI to improve productivity and customer experience.',
    icon: Sparkles,
  },
  {
    title: 'Scalable',
    description: 'Build systems that grow with your business.',
    icon: Layers,
  },
  {
    title: 'Transparent',
    description: 'Clear communication, defined deliverables, professional execution.',
    icon: ShieldCheck,
  },
  {
    title: 'Long-Term',
    description: 'A long-term technology partner, not a one-time vendor.',
    icon: InfinityIcon,
  },
];

export const valuePoints = [
  'Modern Technology',
  'Business-Focused Solutions',
  'AI-Powered',
  'Scalable Systems',
  'Long-Term Support',
];

export const serviceOptions = [
  'Website',
  'E-commerce',
  'Digital Marketing',
  'AI Agent',
  'Business Automation',
  'Branding',
  'Custom Software',
  'Not Sure — Help Me Decide',
];

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'p1',
    category: 'Websites',
    title: 'Corporate Website Platform',
    description: 'A multi-page business website with CMS and SEO foundations.',
    gradient: 'from-brand-500/20 to-brand-700/10',
    icon: Code,
  },
  {
    id: 'p2',
    category: 'E-commerce',
    title: 'Online Store Experience',
    description: 'Full e-commerce store with catalog, checkout and integrations.',
    gradient: 'from-accent-500/20 to-accent-600/10',
    icon: Shop,
  },
  {
    id: 'p3',
    category: 'Branding',
    title: 'Brand Identity System',
    description: 'Complete brand identity — logo, colors, type and guidelines.',
    gradient: 'from-amber-500/20 to-amber-600/10',
    icon: Brush,
  },
  {
    id: 'p4',
    category: 'Marketing',
    title: 'Growth Marketing Campaign',
    description: 'Performance marketing and social campaigns built for scale.',
    gradient: 'from-brand-400/20 to-accent-500/10',
    icon: Mega,
  },
  {
    id: 'p5',
    category: 'AI',
    title: 'AI Customer Support Agent',
    description: 'AI agent handling customer queries and lead qualification.',
    gradient: 'from-accent-400/20 to-brand-600/10',
    icon: AiBot,
  },
  {
    id: 'p6',
    category: 'Automation',
    title: 'Lead Automation Workflow',
    description: 'Automated lead capture, routing and follow-up workflows.',
    gradient: 'from-brand-500/20 to-accent-600/10',
    icon: Auto,
  },
];
