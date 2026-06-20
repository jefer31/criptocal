import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  // Borrar todas las alertas de SOLUSDT que puedan estar huérfanas
  const { data, error } = await supabaseAdmin
    .from('user_alerts')
    .delete()
    .eq('pair', 'SOLUSDT');
    
  return NextResponse.json({ success: true, message: 'SOLUSDT alerts cleaned', error, data });
}
