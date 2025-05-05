'use client'

import {
    EmbeddedCheckout,
    EmbeddedCheckoutProvider
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { fetchClientSecret } from './actions'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

export default async function Checkout({ priceId }: { priceId: string }) {


    if (!priceId) {
        throw new Error('Please provide a valid priceId (`price_1...`)')
    }

    async function fetchClientSecretFallback() {
        const clientSecret = await fetchClientSecret(priceId)
        if (!clientSecret) {
            throw new Error('Failed to fetch client secret.')
        }
        return clientSecret
    }

    return (
        <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret: fetchClientSecretFallback }}
        >
            <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
    )
}