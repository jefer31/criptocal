import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client for JWT verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  try {
    // --- SECURITY: Verify the user is authenticated ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Use the authenticated user's email — never trust email from the request body
    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const { planType } = await request.json();

    // Determinar precios
    // $14.99/mes o $149.00/año
    const amount = planType === 'annual' ? 149.00 : 14.99;
    const description = planType === 'annual' ? 'CriptoCal PRO - Plan Anual' : 'CriptoCal PRO - Plan Mensual';

    // Llamar a NowPayments API para crear un 'invoice'
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      console.error('NOWPAYMENTS_API_KEY no está configurada.');
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // Vercel provee NEXT_PUBLIC_VERCEL_URL automáticamente
    let appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    if (appUrl && !appUrl.startsWith('http')) {
      appUrl = `https://${appUrl}`;
    }

    // Generate a unique order_id that includes the plan type for the webhook
    const orderId = `${userEmail}|${planType}|${Date.now()}`;

    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        order_id: orderId,
        order_description: description,
        ipn_callback_url: `${appUrl}/api/webhooks/nowpayments`,
        success_url: `${appUrl}?payment=success`,
        cancel_url: `${appUrl}?payment=cancel`
      })
    });

    const data = await response.json();

    if (data.invoice_url) {
      return NextResponse.json({ payment_url: data.invoice_url });
    } else {
      console.error('NowPayments Error:', data);
      return NextResponse.json({ error: 'Payment service error. Please try again.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Checkout Endpoint Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
