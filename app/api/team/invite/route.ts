import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/auth/roles';
import { checkSeatLimit } from '@/lib/auth/planLimits';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access point' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Missing required parameters email or role.' }, { status: 400 });
    }

    // Resolve org_id - get user's primary organization
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
      return NextResponse.json({ error: 'No organization found for this user.' }, { status: 404 });
    }

    // Verify requesting user is admin
    const userRole = await getUserRole(supabase, orgId);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions. Admin only.' }, { status: 403 });
    }

    // Check seat limit
    const seatCheck = await checkSeatLimit(orgId);
    if (!seatCheck.allowed) {
      return NextResponse.json({
        error: 'seat_limit_reached',
        type: 'seat',
        used: seatCheck.used,
        limit: seatCheck.limit,
        plan: seatCheck.plan
      }, { status: 429 });
    }

    // Check if email already has an active membership in this org
    const { data: existingMember } = await supabase
      .from('org_members')
      .select('id, status')
      .eq('org_id', orgId)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingMember) {
      if (existingMember.status === 'active') {
        return NextResponse.json({ error: 'This user is already a member of your organization.' }, { status: 409 });
      }
      // Re-send invite for invited or suspended users
      const token = `inv-${Math.random().toString(36).substring(2, 11)}`;
      const { error: updateError } = await supabase
        .from('org_members')
        .update({
          status: 'invited',
          invite_token: token,
          invited_at: new Date().toISOString(),
          invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          invited_by: user.id,
          role
        })
        .eq('id', existingMember.id);

      if (updateError) throw updateError;

      await sendInviteEmail(email, role, token, orgId);
      return NextResponse.json({ success: true, token, resent: true });
    }

    const token = `inv-${Math.random().toString(36).substring(2, 11)}`;

    // Create member entry with email + token (user_id is null until accepted)
    const { error: insertError } = await supabase
      .from('org_members')
      .insert({
        org_id: orgId,
        email: email.toLowerCase().trim(),
        invite_token: token,
        role,
        status: 'invited',
        invited_by: user.id,
        invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'An invitation for this email already exists.' }, { status: 409 });
      }
      throw insertError;
    }

    await sendInviteEmail(email, role, token, orgId);

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error('Error on team invite:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

async function sendInviteEmail(email: string, role: string, token: string, orgId: string) {
  try {
    const inviteLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;

    const { sendEmail } = await import('@/lib/email');
    const { inviteEmailHtml } = await import('@/lib/email-templates');
    await sendEmail({
      to: email,
      subject: "You're invited to join FreightAudit AI",
      html: inviteEmailHtml(role, token, inviteLink),
    });
  } catch (emailErr) {
    console.error('Failed sending invite email:', emailErr);
  }
}
