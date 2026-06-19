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

const MAX_ALERTS = 5;

// Helper to authenticate request
async function authenticateRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await anonSupabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// GET: List all alerts for the user
export async function GET(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Return array (backward compatible: also set config to first item)
    return NextResponse.json({ 
      configs: data || [],
      config: data && data.length > 0 ? data[0] : null 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create or update an alert
export async function POST(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isVip = isVipAdmin(user.email);
    const isPremium = user.user_metadata?.is_premium;
    
    if (!isVip && !isPremium) {
      return NextResponse.json({ error: 'Premium required to save alerts' }, { status: 403 });
    }

    const body = await request.json();
    const { id, pair, exchange_buy, exchange_sell, min_spread, telegram_chat_id, is_active } = body;

    // Validate inputs
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

    // If id provided, update existing alert
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('user_alerts')
        .update({
          pair,
          exchange_buy,
          exchange_sell,
          min_spread,
          telegram_chat_id,
          is_active: is_active ?? true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // Security: ensure user owns this alert
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, config: data });
    }

    // Creating new alert — check limit
    const { count, error: countError } = await supabaseAdmin
      .from('user_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) throw countError;

    if ((count || 0) >= MAX_ALERTS) {
      return NextResponse.json({ 
        error: `Máximo ${MAX_ALERTS} alertas permitidas. Elimina una antes de crear otra.` 
      }, { status: 400 });
    }

    // Insert new alert
    const { data, error } = await supabaseAdmin
      .from('user_alerts')
      .insert({
        user_id: user.id,
        pair,
        exchange_buy,
        exchange_sell,
        min_spread,
        telegram_chat_id,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, config: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a specific alert
export async function DELETE(request: Request) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
      return NextResponse.json({ error: 'ID de alerta requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('user_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', user.id); // Security: only delete your own

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
