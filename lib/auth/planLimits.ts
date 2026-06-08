import { createClient } from '@/lib/supabase/server';
import { PLANS, getPlanByName } from '@/lib/constants/plans';

export interface PlanLimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  type: 'invoice' | 'seat';
  plan: string;
}

// Global Memory fallback handler helper
function getMemoryOrg() {
  const defaultOrg = {
    id: 'org-101',
    name: 'Atlas Global Logistics',
    seat_limit: 3,
    invoice_limit_per_month: 100,
    invoices_used_this_month: 3,
    plan: 'Starter',
    billing_reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  if (typeof global !== 'undefined') {
    if (!(global as any).memoryOrganization) {
      (global as any).memoryOrganization = defaultOrg;
    }
    return (global as any).memoryOrganization;
  }
  return defaultOrg;
}

function getMemoryTeamMembersCount(): number {
  if (typeof global !== 'undefined' && (global as any).memoryTeamMembers) {
    return ((global as any).memoryTeamMembers as any[]).filter(m => m.status !== 'suspended').length;
  }
  return 3;
}

export async function checkInvoiceLimit(orgId: string): Promise<{ allowed: boolean; used: number; limit: number; plan: string }> {
  const supabase = createClient();
  
  try {
    // 1. Fetch organization details from Supabase
    const { data: org, error } = await supabase
      .from('organizations')
      .select('invoices_used_this_month, invoice_limit_per_month, plan, billing_reset_date')
      .eq('id', orgId)
      .maybeSingle();

    if (error || !org) {
      // Fallback to memory
      const memOrg = getMemoryOrg();
      const planName = memOrg.plan || 'Starter';
      const planConfig = getPlanByName(planName);
      const limit = planConfig.invoicesPerMonth ?? 999999;
      const used = memOrg.invoices_used_this_month || 0;
      
      return {
        allowed: used < limit,
        used,
        limit,
        plan: planName
      };
    }

    // Check reset date
    let used = org.invoices_used_this_month ?? 0;
    const limit = org.invoice_limit_per_month ?? 100;
    const plan = org.plan ?? 'Starter';
    const resetDateStr = org.billing_reset_date;

    if (resetDateStr && new Date(resetDateStr) < new Date()) {
      // Reset month limit!
      await resetMonthlyInvoiceCount(orgId);
      used = 0;
    }

    return {
      allowed: used < limit,
      used,
      limit,
      plan
    };
  } catch (err) {
    console.warn("Database limit check lookup failed, using fallback:", err);
    const memOrg = getMemoryOrg();
    const planName = memOrg.plan || 'Starter';
    const planConfig = getPlanByName(planName);
    const limit = planConfig.invoicesPerMonth ?? 999999;
    const used = memOrg.invoices_used_this_month || 0;
    return {
      allowed: used < limit,
      used,
      limit,
      plan: planName
    };
  }
}

export async function checkSeatLimit(orgId: string): Promise<{ allowed: boolean; used: number; limit: number; plan: string }> {
  const supabase = createClient();

  try {
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('seat_limit, plan')
      .eq('id', orgId)
      .maybeSingle();

    const planName = org?.plan ?? 'Starter';
    const limit = org?.seat_limit ?? 3;

    // Count team members with status !== 'suspended'
    const { count, error: countErr } = await supabase
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .not('status', 'eq', 'suspended');

    if (orgErr || countErr || count === null) {
      // Fallback
      const memOrg = getMemoryOrg();
      const memPlan = memOrg.plan || 'Starter';
      const memLimit = memOrg.seat_limit ?? 3;
      const memUsed = getMemoryTeamMembersCount();
      return {
        allowed: memUsed < memLimit,
        used: memUsed,
        limit: memLimit,
        plan: memPlan
      };
    }

    return {
      allowed: count < limit,
      used: count,
      limit: limit,
      plan: planName
    };
  } catch (err) {
    console.warn("Database seat evaluation failed, using fallback:", err);
    const memOrg = getMemoryOrg();
    const memPlan = memOrg.plan || 'Starter';
    const memLimit = memOrg.seat_limit ?? 3;
    const memUsed = getMemoryTeamMembersCount();
    return {
      allowed: memUsed < memLimit,
      used: memUsed,
      limit: memLimit,
      plan: memPlan
    };
  }
}

export async function incrementInvoiceCount(orgId: string, count: number): Promise<void> {
  const supabase = createClient();

  try {
    // Increment invoices used in db
    const { data: org } = await supabase
      .from('organizations')
      .select('invoices_used_this_month')
      .eq('id', orgId)
      .maybeSingle();

    if (org) {
      const updatedCount = (org.invoices_used_this_month || 0) + count;
      await supabase
        .from('organizations')
        .update({ invoices_used_this_month: updatedCount })
        .eq('id', orgId);
    }
  } catch (err) {
    console.error("Database increment error:", err);
  }

  // Always increment in visual fallback-memory store too
  try {
    const memOrg = getMemoryOrg();
    memOrg.invoices_used_this_month = (memOrg.invoices_used_this_month || 0) + count;
  } catch (err) {
    console.error("Memory increment error:", err);
  }
}

export async function resetMonthlyInvoiceCount(orgId: string): Promise<void> {
  const supabase = createClient();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  try {
    await supabase
      .from('organizations')
      .update({
        invoices_used_this_month: 0,
        billing_reset_date: nextMonth.toISOString()
      })
      .eq('id', orgId);
  } catch (err) {
    console.error("Database reset error:", err);
  }

  // Update in visual fallback memory
  try {
    const memOrg = getMemoryOrg();
    memOrg.invoices_used_this_month = 0;
    memOrg.billing_reset_date = nextMonth.toISOString();
  } catch (err) {
    console.error("Memory reset error:", err);
  }
}
