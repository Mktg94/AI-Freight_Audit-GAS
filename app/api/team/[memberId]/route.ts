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
    const { role, status } = body;

    if (!role && !status) {
      return NextResponse.json({ error: 'Missing update payload (role or status)' }, { status: 400 });
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

    const updates: Record<string, string> = {};
    if (role) updates.role = role;
    if (status) updates.status = status;

    const { data: updatedMember, error: updateError } = await supabase
      .from('org_members')
      .update(updates)
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

    // Retrieve target member details including status
    const { data: targetMember } = await supabase
      .from('org_members')
      .select('org_id, user_id, status')
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

    // Prevent self-removal (only for members with user_id)
    if (targetMember.user_id && targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot remove or suspend your own account.' }, { status: 400 });
    }

    // Hard delete for invited members (no auth account yet)
    if (targetMember.status === 'invited' || !targetMember.user_id) {
      const { error: deleteError } = await supabase
        .from('org_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: true });
    }

    // Suspend for active members (keep audit trail)
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
