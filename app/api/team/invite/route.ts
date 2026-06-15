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
  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return;

  try {
    const inviteLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/accept-invite?token=${token}&email=${encodeURIComponent(email)}`;

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'AI Freight Audit', email: 'mikeabrsh21@gmail.com' },
        to: [{ email }],
        subject: "You're invited to join FreightAudit AI",
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background-color:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:40px 16px;">
              <tr>
                <td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                    <tr>
                      <td style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px 40px;text-align:center;">
                        <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 4px 0;">FreightAudit AI</h1>
                        <p style="color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0;">Automated Billing Protection</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px 40px;">
                        <h2 style="color:#111827;font-size:18px;font-weight:700;margin:0 0 4px 0;">You're Invited!</h2>
                        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                          You have been invited to join <strong style="color:#111827;">FreightAudit AI</strong> as a 
                          <span style="display:inline-block;background:#EEF2FF;color:#4F46E5;font-size:12px;font-weight:600;padding:2px 10px;border-radius:4px;text-transform:capitalize;">${role.replace('_', ' ')}</span>
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border-radius:12px;padding:20px;margin-bottom:24px;">
                          <tr>
                            <td style="padding-bottom:12px;">
                              <p style="color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Invitation Code</p>
                              <p style="font-family:monospace;color:#4F46E5;font-size:16px;font-weight:700;margin:0;letter-spacing:1px;">${token}</p>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p style="color:#6B7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;">Expires</p>
                              <p style="color:#111827;font-size:13px;margin:0;">In 7 days</p>
                            </td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="${inviteLink}" style="display:inline-block;background:#4F46E5;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(79,70,229,0.3);">Accept Invitation</a>
                            </td>
                          </tr>
                        </table>
                        <p style="color:#9CA3AF;font-size:12px;line-height:1.5;margin:20px 0 0 0;text-align:center;">This invitation was sent by your organization administrator.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#F9FAFB;padding:20px 40px;text-align:center;border-top:1px solid #E5E7EB;">
                        <p style="color:#9CA3AF;font-size:11px;margin:0;">FreightAudit AI &bull; Automated Billing Protection</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      })
    });
  } catch (emailErr) {
    console.error('Failed sending Brevo email:', emailErr);
  }
}
