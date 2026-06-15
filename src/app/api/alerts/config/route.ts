import { NextResponse } from 'next/server';
import { supabase as anonSupabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { isVipAdmin } from '@/lib/admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set. RLS bypass will fail.');
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await anonSupabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usamos el admin para saltarnos las restricciones RLS (ya validamos al usuario arriba)
    const { data, error } = await supabaseAdmin
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
    const { data: { user }, error: userError } = await anonSupabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isVip = isVipAdmin(user.email);
    const isPremium = user.user_metadata?.is_premium;
    
    if (!isVip && !isPremium) {
      return NextResponse.json({ error: 'Premium required to save alerts' }, { status: 403 });
    }

    const body = await request.json();
    const { pair, exchange_buy, exchange_sell, min_spread, telegram_chat_id, is_active } = body;

    // Validate inputs to prevent bad data or injection
    if (!pair || typeof pair !== 'string') {
      return NextResponse.json({ error: 'Par inválido' }, { status: 400 });
    }
    if (!exchange_buy || typeof exchange_buy !== 'string') {
      return NextResponse.json({ error: 'Exchange de compra inválido' }, { status: 400 });
    }
    if (!exchange_sell || typeof exchange_sell !== 'string') {
      return NextResponse.json({ error: 'Exchange de venta inválido' }, { status: 400 });
    }
    if (typeof min_spread !== 'number' || isNaN(min_spread) || min_spread <= 0) {
      return NextResponse.json({ error: 'Spread mínimo inválido' }, { status: 400 });
    }
    if (!telegram_chat_id || typeof telegram_chat_id !== 'string') {
      return NextResponse.json({ error: 'Chat ID de Telegram inválido' }, { status: 400 });
    }

    // Usamos el admin para el upsert y así evitar el error de "violates row-level security policy"
    const { data, error } = await supabaseAdmin
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
