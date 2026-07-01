import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Usamos el service role porque necesitamos saltarnos el RLS si el token llega raro desde el edge,
// aunque idealmente deberíamos validar el token de usuario
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar que el token sea de un usuario válido
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Guardar en la base de datos
    const { error: dbError } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint' // Si ya existe el endpoint, lo actualiza
      });

    if (dbError) {
      console.error('Error saving subscription:', dbError);
      return NextResponse.json({ error: 'Error al guardar suscripción' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
