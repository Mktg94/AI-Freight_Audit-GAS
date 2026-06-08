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
    const { email, role, org_id: reqOrgId } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Missing required parameters email or role.' }, { status: 400 });
    }

    // Resolve org_id - get user's primary organization
    let orgId = reqOrgId;
    if (!orgId) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();
      orgId = orgData?.id || 'org-101-auth-alpha';
    }

    // Verify requesting user is admin
    const userRole = await getUserRole(supabase, orgId);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions. Admin only.' }, { status: 403 });
    }

    // Check seat limit using shared planLimits logic
    const seatCheck = await checkSeatLimit(orgId);
    if (!seatCheck.allowed) {
      return NextResponse.json({
        error: 'limit_exceeded',
        type: 'seat',
        used: seatCheck.used,
        limit: seatCheck.limit,
        plan: seatCheck.plan
      }, { status: 429 });
    }

    const token = `inv-${Math.random().toString(36).substring(2, 11)}`;

    // Create member entry in Supabase
    const { data: newMember, error: insertError } = await supabase
      .from('org_members')
      .insert({
        org_id: orgId,
        user_id: user.id, // Or a mock placeholder for user invites if not joined yet
        role,
        status: 'invited'
      })
      .select()
      .single();

    // Trigger email via Resend if environment key is defined
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            from: 'FreightAudit AI <onboarding@resend.dev>',
            to: email,
            subject: `You've been invited on FreightAudit AI`,
            html: `
              <div style="font-family: sans-serif; padding: 24px; background: #0A0F1E; color: #F1F5F9; max-width: 600px; margin: auto; border: 1px solid #1F2D45; border-radius: 12px;">
                <h1 style="color: #2DD4BF; font-size: 20px;">Join Team Invitation</h1>
                <p>Hello,</p>
                <p>You have been invited to join FreightAudit AI as a <strong>${role}</strong>.</p>
                <div style="margin: 24px 0;">
                  <a href="${process.env.APP_URL || 'http://localhost:3000'}/auth/accept-invite?token=${token}&org=${orgId}" 
                     style="background: #2DD4BF; color: #0A0F1E; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                     Accept Invitation
                  </a>
                </div>
                <p style="font-size: 11px; color: #94A3B8;">This invite is valid for 7 days.</p>
              </div>
            `
          })
        });
      } catch (emailErr) {
        console.error('Failed sending Resend email:', emailErr);
      }
    }

    return NextResponse.json({ success: true, token, member: newMember });
  } catch (error: any) {
    console.error('Error on team invite:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
