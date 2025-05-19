"use server";

import { redirect } from 'next/navigation'
import { Box, Text, Button, Flex, VStack, Heading } from '@chakra-ui/react'
import Link from 'next/link';

import { stripe } from '@/lib/stripe';

export default async function Return({
    searchParams
}: {
    searchParams: Promise<{ session_id: string }>
}) {
    const { session_id } = await searchParams

    if (!session_id)
        throw new Error('Please provide a valid session_id (`cs_test_...`)')

    console.log('session_id', session_id)
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
            <Flex
                direction="column"
                alignItems="center"
                justifyContent="center"
                minH="100vh"
                p={8}
            >
                <Box
                    as="section"
                    id="success"
                    p={8}
                    borderWidth="1px"
                    borderRadius="lg"
                    boxShadow="xl"
                    textAlign="center"
                    maxW="md"
                >
                    <VStack gap={4}>
                        <Heading as="h1" size="lg" color="green.500">
                            Paiement Réussi!
                        </Heading>
                        <Text fontSize="lg">
                            Merci pour votre confiance, {customer_details?.name}!
                        </Text>
                        <Text>
                            Un email de confirmation a été envoyé à{' '}
                            <Text as="span" fontWeight="bold">{customer_details?.email}</Text>.
                        </Text>
                        <Text>
                            Si vous avez des questions, n&apos;hésitez pas à nous contacter à l&apos;adresse suivante :{' '}
                            <a href="mailto:support@recapeps.fr" color="blue.500">
                                support@recapeps.fr
                            </a>.
                        </Text>
                        <Text fontSize="lg" fontWeight="medium">
                            Bonnes révisions et à bientôt sur Recap&apos;eps!
                        </Text>
                        <Button
                            colorPalette="green"
                            size="lg"
                            mt={6}
                            asChild
                        >
                            <Link href="/parcours/dashboard?refresh_claims=true">
                                Accéder à mon tableau de bord
                            </Link>
                        </Button>
                    </VStack>
                </Box>
            </Flex>
        )
    }
}