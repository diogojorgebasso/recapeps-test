'use client';

import {
    Box,
    Heading,
    Flex,
    List,
    Card,
    Text,
    Icon,
    Button,
    Center,
    Spinner,
} from '@chakra-ui/react';
import { LuCircleCheck } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/clientApp';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/components/AuthProvider';
import { Toaster, toaster } from "@/components/ui/toaster"

interface Plan {
    id: string;
    name: string;
    price: string;
    priceId: string;
    period: string;
    features: string[];
    buttonText: string;
    recommended?: boolean;
}

interface StripeResponse {
    id: string;
}

/* ─── Stripe init ──────────────────────────────────────────────── */
const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

/* ─── Plans array ──────────────────────────────────────────────── */
const PLANS: Plan[] = [
    {
        id: 'monthly',
        name: 'Abonnement Mensuel',
        price: '5,99 €',
        priceId: 'price_1OYSQGEfLSFXfvk1YmzR1IC8',
        period: 'par mois',
        features: [
            'Accès à tous les cours',
            'Flashcards illimitées',
            'Quiz illimités',
            'Notes illimitées',
            "Préparation à l'oral",
        ],
        buttonText: 'Commencer',
    },
    {
        id: 'yearly',
        name: 'Abonnement Annuel',
        price: '149,99 €',
        priceId: 'price_1OYSQnEfLSFXfvk1jcfRgO6C',
        period: 'par an',
        features: [
            'Tout dans le mensuel',
            'Économisez 30 € / an',
            'Accès aux nouveautés en priorité',
            'Support premium',
        ],
        buttonText: 'Commencer',
        recommended: true,
    },
];

/* ─── Component ────────────────────────────────────────────────── */
export default function CheckoutPage() {
    const { user, isPro } = useAuth();
    const router = useRouter();

    const [selectedId, setSelectedId] = useState('yearly');
    const [loadingId, setLoadingId] = useState<string | null>(null);

    /* redirect paid users back to dashboard */
    useEffect(() => {
        if (isPro) router.replace('/dashboard');
    }, [isPro, router]);

    /* handle payment */
    const handleCheckout = async (plan: Plan) => {
        if (!user) {
            toaster.create({
                title: 'Connexion requise',
                description: 'Vous devez être connecté pour vous abonner.',
                type: 'error',
            });
            router.push('/login?from=/checkout');
            return;
        }

        setLoadingId(plan.id);
        try {
            const create = httpsCallable(functions, 'createcheckoutsession');
            const { data } = (await create({ priceId: plan.priceId })) as {
                data: StripeResponse;
            };

            if (data?.id) {
                const stripe = await stripePromise;
                const { error } = await stripe!.redirectToCheckout({
                    sessionId: data.id,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            toaster.create({
                title: 'Erreur',
                description: err.message ?? 'Une erreur s’est produite.',
                type: 'error',
            });
        } finally {
            setLoadingId(null);
        }
    };

    /* loading guard while we figure out pro state */
    if (isPro) {
        return (
            <Center h="80vh">
                <Spinner />
            </Center>
        );
    }

    /* ─── UI ────────────────────────────────────────────────────── */
    return (
        <Box>
            <Toaster />
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
                    {PLANS.map((plan) => {
                        const isSelected = selectedId === plan.id;
                        return (
                            <Card.Root
                                key={plan.id}
                                p={6}
                                flex="1"
                                maxW={{ base: '100%', md: '400px' }}
                                borderWidth="1px"
                                rounded="lg"
                                bg={plan.recommended ? 'blue.50' : 'white'}
                                borderColor={
                                    isSelected ? 'blue.400' : plan.recommended ? 'blue.200' : 'gray.200'
                                }
                                shadow={isSelected ? 'md' : 'none'}
                                cursor="pointer"
                                transition="all 0.25s"
                                _hover={{ borderColor: 'blue.400', transform: 'translateY(-4px)', shadow: 'md' }}
                                onClick={() => setSelectedId(plan.id)}
                            >
                                {/* badge */}
                                {plan.recommended && (
                                    <Box
                                        pos="absolute"
                                        top="-2"
                                        right="5"
                                        bg="green.500"
                                        color="white"
                                        px={3}
                                        py={1}
                                        rounded="full"
                                        fontSize="xs"
                                        fontWeight="bold"
                                    >
                                        Recommandé
                                    </Box>
                                )}

                                <Heading size="lg" mb={2}>
                                    {plan.name}
                                </Heading>

                                <Flex align="baseline" mb={6}>
                                    <Text fontSize="3xl" fontWeight="bold">
                                        {plan.price}
                                    </Text>
                                    <Text ml={2} color="fg.muted">
                                        {plan.period}
                                    </Text>
                                </Flex>

                                {/* features */}
                                <List.Root spaceY={2} mb={6}>
                                    {plan.features.map((f) => (
                                        <List.Item key={f}>
                                            <Flex align="center" gap={2}>
                                                <Icon as={LuCircleCheck} color="green.500" />
                                                <Text>{f}</Text>
                                            </Flex>
                                        </List.Item>
                                    ))}
                                </List.Root>

                                {/* CTA */}
                                <Button
                                    w="full"
                                    size="lg"
                                    variant={isSelected ? 'solid' : 'outline'}
                                    colorPalette={isSelected ? 'blue' : 'gray'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedId(plan.id);
                                        handleCheckout(plan);
                                    }}
                                    loading={loadingId === plan.id}
                                >
                                    {plan.buttonText}
                                </Button>
                            </Card.Root>
                        );
                    })}
                </Flex>

                <Text textAlign="center" mt={8} fontSize="sm" color="fg.muted">
                    Paiement sécurisé via Stripe. Vous pouvez annuler à tout moment.
                </Text>
            </Box>
        </Box>
    );
}
