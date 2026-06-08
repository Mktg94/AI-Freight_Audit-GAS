import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> | { memberId: string } }
) {
  try {
    const resolvedParams = await ('then' in params ? params : Promise.resolve(params));
    const { memberId } = resolvedParams;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access point' }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: 'Missing role update payload' }, { status: 400 });
    }

    // Retrieve target member details to check organization scope
    const { data: targetMember } = await supabase
      .from('org_members')
      .select('org_id, user_id')
      .eq('id', memberId)
      .maybeSingle();

    if (!targetMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const orgId = targetMember.org_id;

    // RBAC Permissions check: requesting user must be an admin
    const userRole = await getUserRole(supabase, orgId);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions. Admins only.' }, { status: 403 });
    }

    // Prevent self-demotion
    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot change your own organization role.' }, { status: 400 });
    }

    const { data: updatedMember, error: updateError } = await supabase
      .from('org_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error: any) {
    console.error('Error on patching member:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> | { memberId: string } }
) {
  try {
    const resolvedParams = await ('then' in params ? params : Promise.resolve(params));
    const { memberId } = resolvedParams;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access point' }, { status: 401 });
    }

    // Retrieve target member details
    const { data: targetMember } = await supabase
      .from('org_members')
      .select('org_id, user_id')
      .eq('id', memberId)
      .maybeSingle();

    if (!targetMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const orgId = targetMember.org_id;

    // RBAC check: requestor must be admin
    const userRole = await getUserRole(supabase, orgId);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions. Admins only.' }, { status: 403 });
    }

    // Prevent self-removal
    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot remove or suspend your own account.' }, { status: 400 });
    }

    // Set status to suspended as requested to keep an audit trail
    const { data: suspendedMember, error: deleteError } = await supabase
      .from('org_members')
      .update({ status: 'suspended' })
      .eq('id', memberId)
      .select()
      .single();

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: suspendedMember });
  } catch (error: any) {
    console.error('Error on deleting member:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
