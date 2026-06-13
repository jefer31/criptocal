import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { planType, email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    // Determinar precios
    // $9.99/mes o $99.00/año
    const amount = planType === 'annual' ? 99.00 : 9.99;
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

    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        order_id: email, // Usamos el correo como order_id para saber a quién activar
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
      return NextResponse.json({ error: `NowPayments Error: ${data.message || JSON.stringify(data)}` }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Checkout Endpoint Error:', error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
