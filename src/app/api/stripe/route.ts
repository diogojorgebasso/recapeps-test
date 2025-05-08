import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    const { email, name, firebaseUID, priceId } = await req.json();

    const existingCustomers = await stripe.customers.list({ email, limit: 1 });

    let customer;
    if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        await stripe.customers.update(customer.id, {
            metadata: { firebaseUID },
        });
    } else {
        customer = await stripe.customers.create({
            email,
            name,
            metadata: { firebaseUID },
        });
    }

    const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        ui_mode: 'embedded',
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        return_url: 'https://recapeps.fr/return?session_id={CHECKOUT_SESSION_ID}',
        metadata: { firebaseUID },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
}
