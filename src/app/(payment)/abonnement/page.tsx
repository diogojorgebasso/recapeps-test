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
} from '@chakra-ui/react';
import { LuCircleCheck } from 'react-icons/lu';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserWithClaims } from '@/lib/getUser';
import { useRouter } from 'next/navigation';

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

/* ─── Plans array ──────────────────────────────────────────────── */
const PLANS: Plan[] = [
    {
        id: 'monthly',
        name: 'Abonnement Mensuel',
        price: '4,99 €',
        priceId: 'price_1QrIBREfLSFXfvk1pguf3yl6',
        period: 'par mois',
        features: [
            'Accès à tous les cours',
            'Fiches de révisions écrits et oraux',
            "Préparation aux oraux",
            'Résiliable à tout moment',
        ],
        buttonText: 'Commencer',
    },
    {
        id: 'yearly',
        name: 'Abonnement Annuel',
        price: '49,99€',
        priceId: 'price_1RQI0iEfLSFXfvk1K53fjPtQ',
        period: 'par an',
        features: [
            'Accès à tous les cours',
            'Fiches de révisions écrits et oraux',
            "Préparation aux oraux",
            "Support premium prioritaire"
        ],
        buttonText: 'Commencer',
        recommended: true,
    },
];

export default function AbonnementPage() {
    const [selectedId, setSelectedId] = useState('yearly');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const router = useRouter();
    const { pro, user } = useUserWithClaims()

    useEffect(() => {
        if (user === undefined) {
            return;
        }

        if (user === null) {
            router.push("/login?redirect=/abonnement");
            return;
        }
    }, [user, router]);

    if (pro) {
        return (
            <Box>
                <Box py={10} px={4}>
                    <Heading as="h1" textAlign="center" mb={10}>
                        Vous êtes déjà abonné à la formule Pro
                    </Heading>
                    <Text textAlign="center" fontSize="lg">
                        Merci de votre confiance ! Vous pouvez accéder à tous les cours sans frais supplémentaires.
                    </Text>
                    <Link href="/parcours/dashboard">
                        <Button
                            colorPalette="blue"
                            size="lg"
                            mt={6}
                        >
                            Accéder à mon tableau de bord
                        </Button>
                    </Link>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Box py={10} px={4}>
                <Heading as="h1" textAlign="center" mb={10}>
                    Choisissez votre formule :
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
                        const isLoading = loadingId === plan.id;
                        return (
                            <Card.Root
                                key={plan.id}
                                p={6}
                                flex="1"
                                maxW={{ base: '100%', md: '400px' }}
                                borderWidth="1px"
                                rounded="lg"
                                borderColor={
                                    isSelected ? 'blue.400' : plan.recommended ? 'blue.200' : 'gray.200'
                                }
                                shadow={isSelected ? 'md' : 'none'}
                                cursor={isLoading ? 'default' : 'pointer'}
                                opacity={isLoading ? 0.7 : 1}
                                transition="all 0.25s"
                                _hover={!isLoading ? { borderColor: 'blue.400', transform: 'translateY(-4px)', shadow: 'md' } : {}}
                                onClick={() => !isLoading && setSelectedId(plan.id)}
                            >
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
                                <Button
                                    w="full"
                                    size="lg"
                                    variant={isSelected ? 'solid' : 'outline'}
                                    colorPalette={isSelected ? 'blue' : 'gray'}
                                    loading={isLoading}
                                    disabled={isLoading}
                                    asChild
                                >
                                    <Link href={{ pathname: "/checkout", query: { priceId: plan.priceId } }}>
                                        {plan.buttonText}
                                    </Link>
                                </Button>
                            </Card.Root>
                        );
                    })}
                </Flex>
                <Text textAlign="center" mt={8} fontSize="sm" color="fg.muted">
                    Paiement sécurisé via Stripe. Vous pouvez résilier à tout moment.
                </Text>
            </Box>
        </Box >
    );
}
