export interface PlanConfig {
  name: string;
  price: number | null;
  seats: number | null;
  invoicesPerMonth: number | null;
  features: string[];
}

export const PLANS: Record<'starter' | 'professional' | 'enterprise', PlanConfig> = {
  starter: {
    name: 'Starter',
    price: 99,
    seats: 3,
    invoicesPerMonth: 100,
    features: [
      'Up to 100 invoices/month',
      '3 user seats',
      'AI invoice extraction',
      'Contract rate matching',
      'Dispute letter generation',
      'Email support'
    ]
  },
  professional: {
    name: 'Professional', 
    price: 299,
    seats: 10,
    invoicesPerMonth: 500,
    features: [
      'Up to 500 invoices/month',
      '10 user seats',
      'Bulk upload + PDF splitting',
      'Priority AI processing',
      'Advanced analytics',
      'Savings dashboard',
      'Priority email support'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: null,  // custom pricing
    seats: null,  // unlimited
    invoicesPerMonth: null,  // unlimited
    features: [
      'Unlimited invoices',
      'Unlimited user seats',
      'Dedicated onboarding',
      'Custom contract rules',
      'SLA guarantee',
      'API access',
      'Dedicated account manager'
    ]
  }
};

export function getPlanByName(plan: string): PlanConfig {
  const norm = plan.toLowerCase();
  if (norm === 'professional') {
    return PLANS.professional;
  }
  if (norm === 'growth') {
    // support both and fallback gracefully
    return PLANS.professional;
  }
  if (norm === 'enterprise') {
    return PLANS.enterprise;
  }
  return PLANS.starter;
}

export function getUpgradePlan(currentPlan: string): PlanConfig | null {
  const norm = currentPlan.toLowerCase();
  if (norm === 'starter') {
    return PLANS.professional;
  }
  if (norm === 'professional' || norm === 'growth') {
    return PLANS.enterprise;
  }
  return null;
}

export function formatPlanLimit(limit: number | null): string {
  if (limit === null) return 'Unlimited';
  return limit.toLocaleString();
}
