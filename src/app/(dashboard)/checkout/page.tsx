'use client';

import { useState, useEffect } from 'react';
import { Box, Heading, List, Button, Card, Text, Center, Flex, Icon, Spinner, useToast } from '@chakra-ui/react';
import { LuCircleCheck } from 'react-icons/lu';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/clientApp';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';

interface Plan {
    id: string;
    name: string;
    price: string;
    priceId: string;
    features: string[];
    buttonText: string;
    period: string;
    recommended?: boolean;
}

interface StripeResponse {
    id: string;
    clientSecret?: string;
}

// Replace with your actual publishable key from Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

const plans: Plan[] = [
    {
        id: 'monthly',
        name: 'Abonnement Mensuel',
        price: '14,99 €',
        priceId: 'price_1OYSQGEfLSFXfvk1YmzR1IC8',
        period: 'par mois',
        features: [
            'Accès à tous les cours',
            'Flashcards illimitées',
            'Quiz illimités',
            'Notes illimitées',
            'Préparation à l\'oral'
        ],
        buttonText: 'Commencer'
    },
    {
        id: 'yearly',
        name: 'Abonnement Annuel',
        price: '149,99 €',
        priceId: 'price_1OYSQnEfLSFXfvk1jcfRgO6C',
        period: 'par an',
        features: [
            'Tout dans l\'abonnement mensuel',
            'Économisez 30 € par an',
            'Accès aux nouveautés en priorité',
            'Support premium'
        ],
        buttonText: 'Commencer',
        recommended: true
    }
];

export default function CheckoutPage() {
    const { currentUser, isAuthenticated } = useAuth();
    const { isSubscribed } = useSubscription();
    const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
    const [loading, setLoading] = useState<boolean>(false);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const toast = useToast();
    const router = useRouter();

    useEffect(() => {
        if (isSubscribed) {
            // If user is already subscribed, redirect to manage subscription
            router.push('/dashboard');
        }
    }, [isSubscribed, router]);

    const handlePlanSelect = (planId: string) => {
        setSelectedPlanId(planId);
    };

    const handleCheckout = async () => {
        if (!currentUser) {
            toast({
                title: 'Connexion requise',
                description: 'Vous devez être connecté pour vous abonner.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            router.push('/login?from=/checkout');
            return;
        }

        const selectedPlan = plans.find(plan => plan.id === selectedPlanId);
        if (!selectedPlan) return;

        setLoading(true);

        try {
            // Call Firebase Function to create checkout session
            const createCheckoutSession = httpsCallable(
                functions,
                'createcheckoutsession'
            );

            const { data } = await createCheckoutSession({
                priceId: selectedPlan.priceId,
            }) as { data: StripeResponse };

            // Redirect to Stripe Checkout
            if (data && data.id) {
                const stripe = await stripePromise;
                const { error } = await stripe!.redirectToCheckout({
                    sessionId: data.id
                });

                if (error) {
                    toast({
                        title: 'Erreur',
                        description: error.message,
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                }
            }
        } catch (error: any) {
            toast({
                title: 'Erreur',
                description: error.message || 'Une erreur s\'est produite',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    if (isSubscribed) {
        return (
            <Center h="80vh">
                <Spinner />
            </Center>
        );
    }

    return (
        <Box py={10} px={4}>
            <Heading as="h1" textAlign="center" mb={10}>
                Choisissez votre formule
            </Heading>

            <Flex
                direction={{ base: 'column', md: 'row' }}
                justify="center"
                align="stretch"
                gap={6}
                maxW="1200px"
                mx="auto"
            >
                {plans.map((plan) => (
                    <Card.Root
                        key={plan.id}
                        p={6}
                        borderWidth="1px"
                        borderRadius="lg"
                        flex="1"
                        maxW={{ base: '100%', md: '400px' }}
                        bg={plan.recommended ? 'blue.50' : 'white'}
                        borderColor={selectedPlanId === plan.id ? 'blue.400' : plan.recommended ? 'blue.200' : 'gray.200'}
                        boxShadow={selectedPlanId === plan.id ? 'md' : 'none'}
                        transition="all 0.3s"
                        position="relative"
                        onClick={() => handlePlanSelect(plan.id)}
                        cursor="pointer"
                        _hover={{
                            borderColor: 'blue.400',
                            transform: 'translateY(-4px)',
                            boxShadow: 'md'
                        }}
                    >
                        {plan.recommended && (
                            <Box
                                position="absolute"
                                top="-2"
                                right="5"
                                bg="green.500"
                                color="white"
                                px={3}
                                py={1}
                                borderRadius="full"
                                fontSize="xs"
                                fontWeight="bold"
                            >
                                Recommandé
                            </Box>
                        )}

                        <Heading as="h2" size="lg" mb={2}>
                            {plan.name}
                        </Heading>

                        <Flex align="baseline" mb={6}>
                            <Text fontSize="3xl" fontWeight="bold">
                                {plan.price}
                            </Text>
                            <Text ml={2} color="gray.600">
                                {plan.period}
                            </Text>
                        </Flex>

                        <List spacing={3} mb={6}>
                            {plan.features.map((feature, index) => (
                                <Flex key={index} align="center">
                                    <Icon as={LuCircleCheck} color="green.500" mr={2} />
                                    <Text>{feature}</Text>
                                </Flex>
                            ))}
                        </List>

                        <Button
                            colorScheme={selectedPlanId === plan.id ? 'blue' : 'gray'}
                            variant={selectedPlanId === plan.id ? 'solid' : 'outline'}
                            w="full"
                            size="lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePlanSelect(plan.id);
                                handleCheckout();
                            }}
                            isLoading={loading && selectedPlanId === plan.id}
                        >
                            {plan.buttonText}
                        </Button>
                    </Card.Root>
                ))}
            </Flex>

            <Text textAlign="center" mt={8} fontSize="sm" color="gray.600">
                Paiement sécurisé via Stripe. Vous pouvez annuler à tout moment.
            </Text>
        </Box>
    );
}
