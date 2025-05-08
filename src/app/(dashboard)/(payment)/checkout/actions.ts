import { db } from '@/lib/firebase/clientApp';
import { stripe } from '../stripe'
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export async function fetchClientSecret(priceId: string) {
    const user = getAuth().currentUser; // Get the current user from Firebase Auth
    if (!user) {
        throw new Error("User ID not found.");
    }

    const userDocRef = doc(db, 'users', user.uid); // Reference to the user's document in Firestore
    const userSnapshot = await getDoc(userDocRef); // Fetch the document snapshot

    if (!userSnapshot.exists()) {
        throw new Error(`User document with ID ${user.uid} not found.`);
    }

    const userData = userSnapshot.data(); // Get the data from the snapshot

    // Check if customer already exists in Stripe
    const existingCustomers = await stripe.customers.list({
        email: userData?.email,
        limit: 1,
    });

    let customer;
    if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        // Optionally update customer metadata if needed
        await stripe.customers.update(customer.id, {
            metadata: { firebaseUID: user.uid },
        });
    } else {
        // Create a new customer if not found
        customer = await stripe.customers.create({
            email: userData?.email,
            name: userData?.name,
            metadata: { firebaseUID: user.uid },
        });
    }


    const session = await stripe.checkout.sessions.create({
        customer: customer.id, // Use the customer ID
        ui_mode: "embedded",
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        return_url: "https://recapeps.fr/return?session_id={CHECKOUT_SESSION_ID}",
        metadata: { firebaseUID: user.uid },
    });

    return session.client_secret
}