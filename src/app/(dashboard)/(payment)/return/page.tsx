"use server";
import { redirect } from 'next/navigation'
import { Box, Text, Link } from '@chakra-ui/react' // Import Chakra UI components

import { stripe } from '@/lib/stripe'; // Adjust the import path as necessary

export default async function Return({
    searchParams
}: {
    searchParams: Promise<{ session_id: string }>
}) {
    const { session_id } = await searchParams

    if (!session_id)
        throw new Error('Please provide a valid session_id (`cs_test_...`)')

    const {
        status,
        customer_details,
    } = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['line_items', 'payment_intent']
    })

    if (status === 'open') {
        return redirect('/')
    }

    if (status === 'complete') {
        return (
            <Box as="section" id="success">
                <Text>
                    We appreciate your business{customer_details?.name}! A confirmation email will be sent to{' '}
                    {customer_details?.email}. If you have any questions, please email{' '}
                </Text>
                <Link href="mailto:suport@recapeps.fr">suport@recapeps.fr</Link>. {/* Use Link for anchor */}
            </Box>
        )
    }
}