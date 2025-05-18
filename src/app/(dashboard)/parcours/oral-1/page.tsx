"use client"

import React from 'react';
import {
    Box,
    Grid,
    GridItem,
    Icon,
    HStack,
    Heading,
    Text,
    Button,
    VStack,
    Dialog,
    Portal,
    CloseButton,
} from '@chakra-ui/react';
import Link from 'next/link';
import { FaBasketballBall, FaRunning } from 'react-icons/fa';
import {
    GiMountainClimbing,
    GiWeightLiftingUp,
    GiStairs,
    GiJuggler,
    GiPingPongBat,
    GiHumanPyramid,
    GiHighPunch
} from 'react-icons/gi';
import { FaPersonDrowning, FaPersonSwimming } from 'react-icons/fa6';
import { useUserWithClaims } from '@/lib/getUser'; // Import client-side hook

const subjects = [
    { key: 'acrosport', label: 'Acrosport', icon: GiHumanPyramid, premium: false },
    { key: 'arts-du-cirque', label: 'Arts du Cirque', icon: GiJuggler, premium: false },
    { key: 'basket', label: 'Basket', icon: FaBasketballBall, premium: true },
    { key: 'escalade', label: 'Escalade', icon: GiMountainClimbing, premium: true },
    { key: 'lutte', label: 'Lutte', icon: GiHighPunch, premium: false },
    { key: 'musculation', label: 'Musculation', icon: GiWeightLiftingUp, premium: true },
    { key: 'natation-vitesse', label: 'Natation Vitesse', icon: FaPersonSwimming, premium: false },
    { key: 'relais-vitesse', label: 'Relais Vitesse', icon: FaRunning, premium: true },
    { key: 'savoir-nager', label: 'Savoir Nager', icon: FaPersonDrowning, premium: false },
    { key: 'step', label: 'Step', icon: GiStairs, premium: true },
    { key: 'tennis-de-table', label: 'Tennis de Table', icon: GiPingPongBat, premium: false },
];

export default function Page() {
    const { user, pro } = useUserWithClaims(); // Use client-side hook

    // Optional: Add a loading state while user and pro status are being determined
    // if (user === undefined) { 
    //     return <Box p={{ base: 4, md: 8 }}><Text>Chargement...</Text></Box>;
    // }

    if (!user) {
        return (
            <Box p={{ base: 4, md: 8 }}>
                <Heading mb={{ base: 4, md: 6 }}>Oral 1</Heading>
                <Text>Veuillez vous connecter pour voir le contenu.</Text>
            </Box>
        );
    }
    return (
        <Box p={{ base: 4, md: 8 }}>
            <Heading mb={{ base: 4, md: 6 }}>Oral 1</Heading>
            <Grid
                templateColumns={{ base: '1fr', md: 'repeat(auto-fit, minmax(200px, 1fr))' }}
                gap={{ base: 4, md: 6 }}
            >
                {subjects.map(({ key, label, icon: IconComponent, premium }) => {
                    const isLocked = premium && !pro;

                    if (isLocked) {
                        return (
                            <GridItem key={key}>
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <Box
                                            as="button" // Make it a button for accessibility with Dialog.Trigger
                                            textAlign="left" // Reset button default text align
                                            width="100%" // Ensure it takes full width of GridItem
                                            bgGradient="to-br"
                                            gradientFrom="gray.400"
                                            gradientTo="gray.500"
                                            p={{ base: 3, md: 6 }}
                                            borderRadius={{ base: 'lg', md: 'xl' }}
                                            boxShadow={{ base: 'sm', md: 'md' }}
                                            opacity={0.7}
                                            filter="grayscale(70%)"
                                            cursor="pointer"
                                            transition="all 0.2s ease"
                                            _hover={{
                                                transform: { md: 'translateY(-2px)' },
                                                boxShadow: { md: 'lg' },
                                            }}
                                        >
                                            <VStack gap={2} align="center">
                                                <Icon as={IconComponent} w={8} h={8} color="whiteAlpha.800" />
                                                <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" color="whiteAlpha.900" textAlign="center">
                                                    {label}
                                                </Text>
                                                <Text fontSize="sm" color="whiteAlpha.700">
                                                    Contenu Pro
                                                </Text>
                                            </VStack>
                                        </Box>
                                    </Dialog.Trigger>
                                    <Portal>
                                        <Dialog.Backdrop />
                                        <Dialog.Positioner>
                                            <Dialog.Content>
                                                <Dialog.Header>
                                                    <Dialog.Title>Contenu exclusif Recap&apos;eps Pro</Dialog.Title>
                                                </Dialog.Header>
                                                <Dialog.Body as="div"> {/* Ensure Dialog.Body is a div */}
                                                    <Text>
                                                        Tu apprécies le contenu que nous te proposons mais tu restes sur ta faim? Tu aimerais accéder à tout le contenu que nous t&apos;avons concocté?
                                                        Alors n&apos;hésite plus et passe à Recap&apos;eps Pro ! 🎯
                                                    </Text>
                                                </Dialog.Body>
                                                <Dialog.Footer>
                                                    <Dialog.CloseTrigger asChild>
                                                        <Button variant="outline" mr={3}>Plus tard</Button>
                                                    </Dialog.CloseTrigger>
                                                    <Button asChild colorScheme="blue">
                                                        <Link href="/abonnement">
                                                            Passer à Pro
                                                        </Link>
                                                    </Button>
                                                </Dialog.Footer>
                                                <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
                                                    <CloseButton size="sm" />
                                                </Dialog.CloseTrigger>
                                            </Dialog.Content>
                                        </Dialog.Positioner>
                                    </Portal>
                                </Dialog.Root>
                            </GridItem>
                        );
                    }

                    return (
                        <GridItem key={key}>
                            <Link href={`/parcours/oral-1/${key}`} passHref>
                                <Box
                                    bgGradient="to-br"
                                    gradientFrom="teal.400"
                                    gradientTo="blue.500"
                                    p={{ base: 3, md: 6 }}
                                    borderRadius={{ base: 'lg', md: 'xl' }}
                                    boxShadow={{ base: 'sm', md: 'md' }}
                                    _hover={{
                                        transform: { md: 'translateY(-4px)' },
                                        boxShadow: { md: 'lg' },
                                        textDecoration: 'none', // Prevent underline on hover for the Box
                                    }}
                                    transition="all 0.2s ease"
                                    cursor="pointer"
                                    display="block" // Ensure the link takes up the box area
                                >
                                    <HStack gap={3} align="center">
                                        <IconComponent />
                                        <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" color="white">
                                            {label}
                                        </Text>
                                    </HStack>
                                </Box>
                            </Link>
                        </GridItem>
                    );
                })}
            </Grid>
        </Box>
    );
}