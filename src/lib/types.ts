import type { LucideIcon } from 'lucide-react';

export type { LucideIcon };

export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

export type SolutionTier = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  highlight?: boolean;
};

export type StepItem = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export type PortfolioItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  gradient: string;
  icon: LucideIcon;
};

export type PageMeta = {
  title: string;
  description: string;
  path: string;
};
