import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Standard default org_id fallback
    let org_id = 'org-101-auth-alpha';
    if (user) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
      if (orgs && orgs.length > 0) {
        org_id = orgs[0].id;
      }
    }

    const userRole = await getUserRole(supabase, org_id);
    if (userRole !== 'admin' && userRole !== 'operations_coordinator') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();


    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        org_id,
        carrier_name: body.carrier_name,
        effective_date: body.effective_date,
        expiry_date: body.expiry_date,
        base_rate_per_lb: Number(body.base_rate_per_lb) || 0,
        base_rate_per_mile: Number(body.base_rate_per_mile) || 0,
        minimum_charge: Number(body.minimum_charge) || 0,
        fuel_surcharge_pct: Number(body.fuel_surcharge_pct) || 0,
        residential_surcharge: Number(body.residential_surcharge) || 0,
        liftgate_fee: Number(body.liftgate_fee) || 0,
        detention_rate_per_hr: Number(body.detention_rate_per_hr) || 0,
        inside_delivery_fee: Number(body.inside_delivery_fee) || 0,
        redelivery_fee: Number(body.redelivery_fee) || 0,
        custom_rules: body.custom_rules || [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: contract });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
