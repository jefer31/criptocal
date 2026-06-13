import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Necesitamos el Service Role Key para poder editar usuarios desde el servidor sin sesión
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-nowpayments-sig');
    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    const payloadString = await request.text();
    const secret = process.env.NOWPAYMENTS_IPN_SECRET || '';

    // Generar la firma esperada usando HMAC-SHA512
    const hmac = crypto.createHmac('sha512', secret);
    hmac.update(payloadString);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid signature.', { expected: expectedSignature, received: signature });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(payloadString);
    console.log('NowPayments IPN Received:', payload);

    // Los estados exitosos en NowPayments son "finished" o "confirmed"
    const isSuccess = payload.payment_status === 'finished' || payload.payment_status === 'confirmed';

    if (isSuccess && payload.order_id) {
      const userEmail = payload.order_id;
      console.log(`Payment confirmed for: ${userEmail}`);

      // Buscar al usuario por correo usando Admin API (requiere Service Role Key)
      // Supabase no tiene una forma directa de "buscar usuario por email" en la API pública.
      // Sin embargo, podemos usar el Service Role Key (Admin API) para listar o actualizar.
      
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        console.error('Error listing users:', listError);
        return NextResponse.json({ error: 'DB Error' }, { status: 500 });
      }

      const user = usersData.users.find((u: any) => u.email === userEmail);
      if (user) {
        // Actualizar el perfil del usuario a PREMIUM
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { user_metadata: { is_premium: true } }
        );

        if (updateError) {
          console.error('Error updating user premium status:', updateError);
        } else {
          console.log(`User ${userEmail} successfully upgraded to PRO!`);
        }
      } else {
        console.error(`User with email ${userEmail} not found in database.`);
      }
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
