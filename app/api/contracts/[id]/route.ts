import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await ('then' in params ? params : Promise.resolve(params));
    const { id } = resolvedParams;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access point' }, { status: 401 });
    }

    // RBAC: check permissions
    const { data: contractDetails } = await supabase
      .from('contracts')
      .select('org_id')
      .eq('id', id)
      .maybeSingle();
    const contractOrgId = contractDetails?.org_id || 'org-101-auth-alpha';

    const userRole = await getUserRole(supabase, contractOrgId);
    if (userRole !== 'admin' && userRole !== 'operations_coordinator') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();


    const { data: contract, error } = await supabase
      .from('contracts')
      .update({
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
        custom_rules: body.custom_rules || []
      })
      .eq('id', id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await ('then' in params ? params : Promise.resolve(params));
    const { id } = resolvedParams;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access point' }, { status: 401 });
    }

    // RBAC: check permissions
    const { data: contractDetails } = await supabase
      .from('contracts')
      .select('org_id')
      .eq('id', id)
      .maybeSingle();
    const contractOrgId = contractDetails?.org_id || 'org-101-auth-alpha';

    const userRole = await getUserRole(supabase, contractOrgId);
    if (userRole !== 'admin' && userRole !== 'operations_coordinator') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { error } = await supabase

      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Contract agreement successfully removed' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
