'use server'

import { stripe } from '@/lib/stripe'
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp'

export async function fetchClientSecret(priceId: string) {
    const { currentUser } = await getAuthenticatedAppForUser()

    const customerData = await stripe.customers.create({
        email: userDoc.data()?.email,
        name: userDoc.data()?.name,
        metadata: { firebaseUID: userId },
    });

    const session = await stripe.checkout.sessions.create({
        customer,
        ui_mode: "embedded",
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        return_url: "https://recapeps.fr/return?session_id={CHECKOUT_SESSION_ID}",
        metadata: { firebaseUID: userId },
    });

    return session.client_secret
}