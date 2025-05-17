import Checkout from './CheckoutComponent'
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp'

export default async function Page({ searchParams }: { searchParams: Promise<{ priceId: string }> }) {
    const { priceId } = await searchParams
    const { pro } = await getAuthenticatedAppForUser();
    if (pro) {
        return (
            <div id="checkout">
                <h1>Vous êtes déjà abonné</h1>
            </div>
        )
    }
    return (
        <div id="checkout">
            <Checkout priceId={priceId} />
        </div>
    )
}