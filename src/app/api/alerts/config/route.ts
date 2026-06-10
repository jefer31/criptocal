import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Note: In App Router, getting the session from cookies usually requires @supabase/ssr
    // But since this is a simple API, we'll rely on the client passing an Authorization header 
    // or we can fetch by user_id if passed. Actually, the easiest way for now is to pass user_id in headers/query 
    // or rely on Supabase RLS. Let's assume we pass the session token or user_id.
    
    // To keep it simple and stateless without extra packages, we expect the frontend 
    // to pass the user's access token in the Authorization header.
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      // Fallback: If no header, just return empty config (Client will handle)
      return NextResponse.json({ error: 'No auth header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw error;
    }

    return NextResponse.json({ config: data || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pair, exchange_buy, exchange_sell, min_spread, telegram_chat_id, is_active } = body;

    // Upsert the config
    const { data, error } = await supabase
      .from('user_alerts')
      .upsert({
        user_id: user.id,
        pair,
        exchange_buy,
        exchange_sell,
        min_spread,
        telegram_chat_id,
        is_active,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, config: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
