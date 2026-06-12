import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ status: data.status, invoice: data });

  } catch (err: any) {
    console.error("Status check failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
