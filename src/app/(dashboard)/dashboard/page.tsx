'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Grid,
    GridItem,
    Heading,
    Text,
    Card,
    SimpleGrid,
    Flex,
    Button,
    Icon,
    Stack,
} from '@chakra-ui/react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { SubjectCard } from '@/components/SubjectCard';
import { StreakTracker } from '@/components/StreakTracker';
import { AchievementBadge } from '@/components/AchievementBadge';
import { FiArrowRight, FiCalendar, FiBookOpen, FiAward } from 'react-icons/fi';

// Mock data for subjects - replace with Firestore data in production
const subjects = [
    { id: '1', title: 'Culture professionnelle', progress: 45, icon: '📚' },
    { id: '2', title: 'Conception d\'un projet', progress: 30, icon: '📝' },
    { id: '3', title: 'Entretien avec le jury', progress: 20, icon: '🎤' },
    { id: '4', title: 'Cas pratique', progress: 10, icon: '💼' },
];

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { isSubscribed } = useSubscription();
    const router = useRouter();
    const [streak, setStreak] = useState(0);

    // Fetch user activity and streak data - replace with actual Firestore queries
    useEffect(() => {
        // Simulating streak fetch from database
        setStreak(5); // Example streak value
    }, []);

    return (
        <Box>
            <Box mb={8}>
                <Heading as="h1" size="xl" mb={2}>
                    Bonjour, {currentUser?.displayName || 'utilisateur'}
                </Heading>
                <Text color="gray.600">
                    Continuez votre préparation pour l'examen professionnel d'EPS
                </Text>
            </Box>

            <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 3fr) minmax(0, 1fr)' }} gap={8}>
                <GridItem>
                    <Box mb={8}>
                        <Flex justify="space-between" align="center" mb={4}>
                            <Heading as="h2" size="lg">
                                Vos matières
                            </Heading>
                            <Button
                                rightIcon={<Icon as={FiArrowRight} />}
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => router.push('/subjects')}
                            >
                                Voir tout
                            </Button>
                        </Flex>

                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 4 }} spacing={4}>
                            {subjects.map((subject) => (
                                <SubjectCard
                                    key={subject.id}
                                    title={subject.title}
                                    icon={subject.icon}
                                    progress={subject.progress}
                                    onClick={() => router.push(`/subjects/${subject.id}`)}
                                />
                            ))}
                        </SimpleGrid>
                    </Box>

                    <Box mb={8}>
                        <Heading as="h2" size="lg" mb={4}>
                            Activités recommandées
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                            <Card.Root p={5} borderRadius="lg">
                                <Flex direction="column" h="full">
                                    <Icon as={FiBookOpen} boxSize={8} color="blue.500" mb={3} />
                                    <Heading as="h3" size="md" mb={2}>
                                        Flashcards
                                    </Heading>
                                    <Text flex="1" mb={4}>
                                        Révisez les concepts clés avec nos flashcards interactives.
                                    </Text>
                                    <Button
                                        onClick={() => router.push('/flashcards')}
                                        colorScheme="blue"
                                        mt="auto"
                                    >
                                        Commencer
                                    </Button>
                                </Flex>
                            </Card.Root>

                            <Card.Root p={5} borderRadius="lg">
                                <Flex direction="column" h="full">
                                    <Icon as={FiAward} boxSize={8} color="green.500" mb={3} />
                                    <Heading as="h3" size="md" mb={2}>
                                        Quiz
                                    </Heading>
                                    <Text flex="1" mb={4}>
                                        Testez vos connaissances avec des quiz thématiques.
                                    </Text>
                                    <Button
                                        onClick={() => router.push('/quiz')}
                                        colorScheme="green"
                                        mt="auto"
                                    >
                                        Commencer
                                    </Button>
                                </Flex>
                            </Card.Root>

                            <Card.Root p={5} borderRadius="lg">
                                <Flex direction="column" h="full">
                                    <Icon as={FiCalendar} boxSize={8} color="purple.500" mb={3} />
                                    <Heading as="h3" size="md" mb={2}>
                                        Oral
                                    </Heading>
                                    <Text flex="1" mb={4}>
                                        Préparez-vous à l'épreuve orale avec notre simulateur interactif.
                                    </Text>
                                    <Button
                                        onClick={() => router.push('/oral-3')}
                                        colorScheme="purple"
                                        mt="auto"
                                    >
                                        Commencer
                                    </Button>
                                </Flex>
                            </Card.Root>
                        </SimpleGrid>
                    </Box>
                </GridItem>

                <GridItem>
                    <Stack spacing={6}>
                        <Card.Root p={4} borderRadius="lg">
                            <Heading as="h3" size="md" mb={3}>
                                Votre progression
                            </Heading>
                            <StreakTracker days={streak} />
                            <Text mt={3} textAlign="center">
                                {streak} jours de révision consécutifs !
                            </Text>
                        </Card.Root>

                        {!isSubscribed && (
                            <Card.Root p={4} borderRadius="lg" bgGradient="linear(to-r, blue.400, purple.500)" color="white">
                                <Heading as="h3" size="md" mb={3}>
                                    Débloquez tout le contenu
                                </Heading>
                                <Text mb={4}>
                                    Accédez à tout le contenu premium avec notre abonnement.
                                </Text>
                                <Button
                                    colorScheme="whiteAlpha"
                                    onClick={() => router.push('/checkout')}
                                >
                                    S'abonner
                                </Button>
                            </Card.Root>
                        )}

                        <Card.Root p={4} borderRadius="lg">
                            <Heading as="h3" size="md" mb={3}>
                                Vos badges
                            </Heading>
                            <SimpleGrid columns={3} spacing={3}>
                                <AchievementBadge title="Premier quiz" icon="🏆" achieved />
                                <AchievementBadge title="5 jours consécutifs" icon="🔥" achieved={streak >= 5} />
                                <AchievementBadge title="Expert" icon="🎓" achieved={false} />
                            </SimpleGrid>
                        </Card.Root>
                    </Stack>
                </GridItem>
            </Grid>
        </Box>
    );
}