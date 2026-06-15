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

    // Sign up the user with the invited email
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        data: { full_name }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        return NextResponse.json({ error: 'An account with this email already exists. Please log in first, then ask the admin to re-invite you.' }, { status: 409 });
      }
      throw signUpError;
    }

    if (!authData?.user) {
      return NextResponse.json({ error: 'Failed to create user account.' }, { status: 500 });
    }

    // Link the new user to the org_members row
    const { error: updateError } = await supabase
      .from('org_members')
      .update({
        user_id: authData.user.id,
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
