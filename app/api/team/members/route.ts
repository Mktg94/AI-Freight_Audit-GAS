import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's org
    let orgId: string | null = null;

    const { data: ownerOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle();

    if (ownerOrg?.id) {
      orgId = ownerOrg.id;
    } else {
      const { data: memberOrg } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      orgId = memberOrg?.org_id || null;
    }

    if (!orgId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Use the org_member_details view
    const { data, error } = await supabase
      .from('org_member_details')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const members = (data || []).map((m: any) => ({
      id: m.id,
      org_id: m.org_id,
      user_id: m.user_id,
      full_name: m.full_name || m.user_full_name || m.email || 'Unknown',
      email: m.email || '',
      role: m.role,
      status: m.status,
      created_at: m.created_at
    }));

    return NextResponse.json({ success: true, data: members });
  } catch (err: any) {
    console.warn('Failed to fetch team members:', err.message);
    return NextResponse.json({ success: true, data: [] });
  }
}
