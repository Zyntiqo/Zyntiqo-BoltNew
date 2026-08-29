/**
 * Zyntiqo knowledge base for the customer-facing AI chatbot.
 *
 * Contains ONLY information that is verified and present in the existing
 * project. Does NOT invent clients, testimonials, statistics, pricing,
 * awards, certifications, or case studies.
 */

import { services } from '../data';

export type KnowledgeEntry = {
  keywords: string[];
  response: string;
  recommendService?: string;
  recommendAction?: 'quote' | 'consultation' | 'whatsapp' | 'contact';
};

const serviceNameMap: Record<string, string> = {
  website: 'Website Development',
  'website development': 'Website Development',
  ecommerce: 'E-commerce Solutions',
  'e-commerce': 'E-commerce Solutions',
  'e commerce': 'E-commerce Solutions',
  marketing: 'Digital Marketing',
  'digital marketing': 'Digital Marketing',
  ai: 'AI Agents',
  'ai agent': 'AI Agents',
  'ai agents': 'AI Agents',
  chatbot: 'AI Agents',
  automation: 'Business Automation',
  'business automation': 'Business Automation',
  branding: 'Branding & Creative',
  'custom software': 'Custom Software',
  software: 'Custom Software',
};

export const knowledgeBase: KnowledgeEntry[] = [
  {
    keywords: ['website', 'web', 'landing page', 'web app', 'web application', 'site'],
    response:
      "Zyntiqo builds business websites, landing pages, e-commerce stores and custom web applications. We focus on fast, modern, SEO-friendly sites that convert visitors into customers. Would you like to get started with a website project?",
    recommendService: 'Website Development',
    recommendAction: 'consultation',
  },
  {
    keywords: ['ecommerce', 'e-commerce', 'online store', 'shop', 'product catalog', 'checkout'],
    response:
      "Zyntiqo builds complete e-commerce solutions — online stores with product catalogs, checkout systems, payment integrations and growth features. Would you like to discuss your e-commerce project?",
    recommendService: 'E-commerce Solutions',
    recommendAction: 'quote',
  },
  {
    keywords: ['marketing', 'instagram', 'facebook', 'social media', 'ads', 'advertising', 'seo', 'growth', 'more customers', 'traffic', 'campaign'],
    response:
      "Digital Marketing could be a great fit. Zyntiqo handles performance marketing, social media, advertising strategy, content and growth campaigns designed to bring you more customers. Would you like a quote or a consultation?",
    recommendService: 'Digital Marketing',
    recommendAction: 'consultation',
  },
  {
    keywords: ['ai', 'ai agent', 'chatbot', 'ai assistant', 'ai bot', 'machine learning', 'ml', 'automation'],
    response:
      "Zyntiqo builds AI-powered agents for customer support, sales assistance, and business workflows. We can also automate repetitive tasks across your business. Would you like to explore an AI agent for your business?",
    recommendService: 'AI Agents',
    recommendAction: 'consultation',
  },
  {
    keywords: ['automation', 'automate', 'workflow', 'repetitive', 'streamline', 'efficiency'],
    response:
      "Business Automation is one of our specialties. We automate lead management, customer workflows, internal operations and repetitive processes so your team can focus on what matters. Would you like to discuss automation for your business?",
    recommendService: 'Business Automation',
    recommendAction: 'consultation',
  },
  {
    keywords: ['branding', 'brand', 'logo', 'identity', 'design', 'visual', 'creative'],
    response:
      "Zyntiqo offers complete branding and creative services — brand identity, visual design, social creatives and marketing assets. Would you like to explore a branding project?",
    recommendService: 'Branding & Creative',
    recommendAction: 'quote',
  },
  {
    keywords: ['custom software', 'software', 'internal tool', 'portal', 'crm', 'dashboard', 'system'],
    response:
      "Zyntiqo builds purpose-built custom software — internal tools, customer portals and connected systems designed around the way you work. Would you like to discuss your software needs?",
    recommendService: 'Custom Software',
    recommendAction: 'consultation',
  },
  {
    keywords: ['book', 'meeting', 'consultation', 'call', 'schedule', 'appointment', 'talk to someone', 'meet'],
    response:
      "You can book a consultation with our team. We offer Discovery Calls, Project Consultations, Technical Consultations, Marketing Consultations and AI & Automation Consultations. Would you like to book one now?",
    recommendAction: 'consultation',
  },
  {
    keywords: ['quote', 'price', 'pricing', 'cost', 'estimate', 'budget'],
    response:
      "I can help you request a quote. You'll need to tell us which service you need, your project requirements, budget range and timeline. Would you like to request a quote now?",
    recommendAction: 'quote',
  },
  {
    keywords: ['whatsapp', 'chat', 'message', 'phone', 'call you', 'contact', 'email', 'reach', 'wecare'],
    response:
      "You can reach Zyntiqo by email at wecare@zyntiqo.com, or you can start a WhatsApp chat with our team directly. Would you like to continue on WhatsApp?",
    recommendAction: 'whatsapp',
  },
  {
    keywords: ['service', 'services', 'what do you do', 'what do you offer', 'help', 'offer'],
    response:
      "Zyntiqo offers seven core services: Website Development, E-commerce Solutions, Digital Marketing, AI Agents, Business Automation, Branding & Creative, and Custom Software. We help businesses build, grow and automate. Which area are you most interested in?",
  },
  {
    keywords: ['get started', 'start', 'begin', 'how do i', 'how to start'],
    response:
      "Getting started is easy! You can fill out our project form, request a quote, or book a consultation. What would you prefer?",
    recommendAction: 'contact',
  },
  {
    keywords: ['zyntiqo', 'who are you', 'about', 'company', 'what is zyntiqo'],
    response:
      "Zyntiqo is a digital business partner. Our tagline is Build. Grow. Automate. We provide website development, e-commerce, digital marketing, AI agents, business automation, branding and custom software — all from one team. What can we help you with today?",
  },
];

export const chatbotWelcomeMessage =
  "Hi! I'm Zyntiqo AI. I can help you explore our services, understand which solution may fit your business, answer questions, and help you get started.";

export const chatbotNotConfiguredMessage =
  "I'm Zyntiqo AI, but my AI brain isn't fully connected yet. I can still help you explore our services and connect you with our team. What are you looking for?";

/**
 * Match a user message against the knowledge base using keyword matching.
 * Returns the best matching entry, or null if no good match.
 */
export function matchKnowledge(input: string): KnowledgeEntry | null {
  const lower = input.toLowerCase();
  let bestMatch: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length; // Longer keywords are more specific
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

/**
 * Detect which service a user is asking about from their message.
 */
export function detectService(input: string): string | undefined {
  const lower = input.toLowerCase();
  for (const [key, name] of Object.entries(serviceNameMap)) {
    if (lower.includes(key)) return name;
  }
  return undefined;
}

export { serviceNameMap };
