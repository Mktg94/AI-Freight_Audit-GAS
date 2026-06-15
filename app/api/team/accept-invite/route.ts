import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token) {
      return NextResponse.json({ error: 'Missing invite token.' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: invite } = await supabase
      .from('org_members')
      .select(`
        id, org_id, email, role, status, invited_at, invite_expires_at,
        organizations:org_id ( name )
      `)
      .eq('invite_token', token)
      .eq('status', 'invited')
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found or already accepted.' }, { status: 404 });
    }

    if (invite.invite_expires_at && new Date(invite.invite_expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 });
    }

    if (email && invite.email !== email.toLowerCase().trim()) {
      return NextResponse.json({ error: 'Email mismatch. Please use the email address that was invited.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invite: {
        org_name: (invite.organizations as any)?.name || 'Your Organization',
        email: invite.email,
        role: invite.role
      }
    });
  } catch (error: any) {
    console.error('Error validating invite:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, full_name, password } = body;

    if (!token || !full_name || !password) {
      return NextResponse.json({ error: 'Missing required fields: token, full_name, password.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const supabase = createClient();

    // Look up the invite
    const { data: invite } = await supabase
      .from('org_members')
      .select('id, org_id, email, role, status')
      .eq('invite_token', token)
      .eq('status', 'invited')
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found or already accepted.' }, { status: 404 });
    }

    if (!invite.email) {
      return NextResponse.json({ error: 'Invite has no associated email.' }, { status: 400 });
    }

    // Create the auth user (bypasses email confirmation with service_role key)
    let authUserId: string | null = null;
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (createError) {
      if (createError.code === 'email_exists') {
        // User already has an auth account — fetch their existing ID
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(u => u.email === invite.email);
        if (existing) {
          authUserId = existing.id;
        } else {
          return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
        }
      } else {
        throw createError;
      }
    } else if (authData?.user) {
      authUserId = authData.user.id;
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Failed to create or find user account.' }, { status: 500 });
    }

    // Update password and metadata on existing account
    if (createError?.code === 'email_exists') {
      await supabase.auth.admin.updateUserById(authUserId, { password, user_metadata: { full_name } });
    }

    // Link the user to the org_members row
    const { error: updateError } = await supabase
      .from('org_members')
      .update({
        user_id: authUserId,
        full_name,
        status: 'active',
        invite_token: null,
        invited_at: new Date().toISOString()
      })
      .eq('id', invite.id);

    if (updateError) {
      console.error('Failed to link user to org:', updateError);
      // Account was created but linking failed — still return success with warning
      return NextResponse.json({
        success: true,
        warning: 'Account created but failed to link to organization. Please contact support.',
        needsRelink: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account created and linked to organization successfully.'
    });
  } catch (error: any) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
