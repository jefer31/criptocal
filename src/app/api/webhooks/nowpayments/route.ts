import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Necesitamos el Service Role Key para poder editar usuarios desde el servidor sin sesión
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

if (!supabaseServiceKey) {
  console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set. Webhook will fail.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || '');

export async function POST(request: Request) {
  try {
    // --- SECURITY: Verify IPN secret exists ---
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
    if (!ipnSecret) {
      console.error('CRITICAL: NOWPAYMENTS_IPN_SECRET is not set. Rejecting all webhooks.');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const signature = request.headers.get('x-nowpayments-sig');
    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    const payloadString = await request.text();
    const payload = JSON.parse(payloadString);

    // --- SECURITY: Sort keys before HMAC verification (NowPayments requirement) ---
    const sortedPayload = Object.keys(payload)
      .sort()
      .reduce((acc: Record<string, any>, key: string) => {
        acc[key] = payload[key];
        return acc;
      }, {});

    const hmac = crypto.createHmac('sha512', ipnSecret);
    hmac.update(JSON.stringify(sortedPayload));
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('NowPayments IPN verified:', payload.payment_status, payload.order_id);

    // Los estados exitosos en NowPayments son "finished" o "confirmed"
    const isSuccess = payload.payment_status === 'finished' || payload.payment_status === 'confirmed';

    if (isSuccess && payload.order_id) {
      // Parse order_id format: "email|planType|timestamp"
      const orderParts = payload.order_id.split('|');
      const userEmail = orderParts[0];
      const planType = orderParts.length > 1 ? orderParts[1] : 'monthly';

      if (!userEmail || !userEmail.includes('@')) {
        console.error('Invalid email in order_id:', payload.order_id);
        return NextResponse.json({ status: 'OK' });
      }

      console.log(`Payment confirmed for: ${userEmail}, plan: ${planType}`);

      // --- SECURITY: Search user by email directly instead of listing ALL users ---
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1,
        page: 1,
      });

      // Workaround: Supabase Admin API doesn't support email filter in listUsers,
      // so we use a paginated approach to find the user
      let targetUser = null;
      let page = 1;
      const perPage = 100;

      while (!targetUser) {
        const { data: pageData, error: pageError } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

        if (pageError) {
          console.error('Error listing users:', pageError);
          return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        targetUser = pageData.users.find((u: any) => u.email === userEmail);

        if (targetUser || pageData.users.length < perPage) break;
        page++;
      }

      if (targetUser) {
        // --- Calculate expiration date based on plan type ---
        const now = new Date();
        const expiresAt = new Date(now);
        if (planType === 'annual') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        // Actualizar el perfil del usuario a PREMIUM con metadata de expiración
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUser.id,
          {
            user_metadata: {
              is_premium: true,
              premium_since: now.toISOString(),
              premium_plan: planType,
              premium_expires_at: expiresAt.toISOString(),
            }
          }
        );

        if (updateError) {
          console.error('Error updating user premium status:', updateError);
        } else {
          console.log(`User ${userEmail} upgraded to PRO (${planType}), expires: ${expiresAt.toISOString()}`);
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
