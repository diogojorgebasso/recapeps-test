import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Chart, useChart } from "@chakra-ui/charts"

import {
    VStack,
    Box,
    Heading,
    Text,
    Flex,
    SimpleGrid,
    Button,
    Icon,
    Card,
    Grid,
    GridItem,
    Stack,
    Table,
    EmptyState,
} from '@chakra-ui/react';
import {
    FiArrowRight,
    FiBookOpen,
    FiAward,
    FiCalendar,
} from 'react-icons/fi';
import { FaPlugCircleBolt } from "react-icons/fa6";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

import { Toaster, toaster } from "@/components/ui/toaster"
import { useAuth } from '@/components/AuthProvider';
import { SubjectCard } from '@/components/SubjectCard';
import { StreakTracker } from '@/components/StreakTracker';
import { AchievementBadge } from '@/components/AchievementBadge';
import { QuizResult } from '@/types/Quiz';

import { getUserQuizzes, getUserStreak } from "@/lib/firebase/serverQueries";

export const dynamic = "force-dynamic";   // we read the session cookie

/* ------------------------------------------------------------------ *
 *                      Define Actual Subjects                        *
 * ------------------------------------------------------------------ */
// TODO: Replace with actual subject data and icons
const SUBJECTS = [
    { id: 'ecrit-1', title: 'Écrit 1', icon: FiBookOpen, progress: 75 },
    { id: 'ecrit-2', title: 'Écrit 2', icon: FiAward, progress: 50 },
    { id: 'oral-1', title: 'Oral 1', icon: FiCalendar, progress: 25 },
    { id: 'oral-2', title: 'Oral 2', icon: FiCalendar, progress: 10 },
    // Add more subjects as needed
];

export default async function DashboardPage() {
    const quizzes = await getUserQuizzes();
    const streak = await getUserStreak();

    return <DashboardComponent initialQuizzes={quizzes} initialStreak={streak} />;
}

/* ------------------------------------------------------------------ *
 *                      Client Component Logic                        *
 * ------------------------------------------------------------------ */
'use client';

function DashboardComponent({
    initialQuizzes,
    initialStreak,
}: {
    initialQuizzes: QuizResult[];
    initialStreak: number;
}) {
    const { user, isPro } = useAuth();
    const router = useRouter();

    const chartData = initialQuizzes.map(({ subjectId, score, date }) => ({
        subjectId,
        score,
        date: date.toDate().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }),
    }));

    // Use initialQuizzes prop instead of quizData
    const grouped = initialQuizzes.reduce<Record<
        string,
        { attempts: number; best: number; last: string }
    >>((acc, q) => {
        const g = acc[q.subjectId] ?? { attempts: 0, best: 0, last: q.date };
        g.attempts += 1;
        g.best = Math.max(g.best, q.score);
        g.last = q.date.toDate() > new Date(g.last) ? q.date.toDate() : new Date(g.last);
        acc[q.subjectId] = g;
        return acc;
    }, {});

    const tableRows = Object.entries(grouped).map(([name, s]) => ({
        subjectId: name,
        attempts: s.attempts,
        best: s.best,
        last: s.last,
    }));

    /* ------------------------------- UI ------------------------ */
    return (
        <Box>
            <Toaster />

            <Box mb={8}>
                <Heading size="xl" mb={2}>
                    Bonjour, {user?.displayName ?? 'utilisateur'}
                </Heading>
                <Text color="fg.muted">
                    Continuez votre préparation pour le CAPEPS.
                </Text>
            </Box>

            <Grid
                templateColumns={{ base: '1fr', lg: 'minmax(0, 3fr) minmax(0,1fr)' }}
                gap={8}
            >
                {/* ================= LEFT COLUMN ========================= */}
                <GridItem>
                    {/* subjects */}
                    <SectionTitle
                        title="Vos matières"
                        ctaLabel="Voir tout"
                        onCta={() => router.push('/subjects')}
                    />
                    <SimpleGrid
                        columns={{ base: 1, sm: 2, md: 3, xl: 4 }}
                        gap={4}
                        mb={8}
                    >
                        {SUBJECTS.map((s) => (
                            <Link key={s.id} href={`/subjects/${s.id}`} passHref legacyBehavior>
                                <SubjectCard
                                    title={s.title}
                                    icon={s.icon}
                                    progress={s.progress}
                                />
                            </Link>
                        ))}
                    </SimpleGrid>

                    <Heading as="h2" size="lg" mb={4}>
                        Activités recommandées
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={10}>
                        <ActivityCard
                            title="Écrit 1"
                            icon={FiBookOpen}
                            color="blue"
                            desc="Révisez les concepts clés."
                            route="/ecrit-1"
                        />
                        <ActivityCard
                            title="Écrit 2"
                            icon={FiAward}
                            color="green"
                            desc="Testez vos connaissances."
                            route="/ecrit-2"
                        />
                        <ActivityCard
                            title="Oral"
                            icon={FiCalendar}
                            color="purple"
                            desc="Simulateur interactif pour l'oral."
                            route="/oral-3"
                        />
                    </SimpleGrid>

                    <Heading as="h2" size="lg" mb={4}>
                        Vos derniers résultats
                    </Heading>

                    {/* Use initialQuizzes prop */}
                    {initialQuizzes.length === 0 ? (
                        <EmptyState.Root>
                            <EmptyState.Content>
                                <EmptyState.Indicator>
                                    <FaPlugCircleBolt />
                                </EmptyState.Indicator>

                                <VStack gap={3} textAlign="center">
                                    <EmptyState.Title>Aucun résultat</EmptyState.Title>

                                    <EmptyState.Description>
                                        Commencez un quiz pour voir vos résultats ici.
                                    </EmptyState.Description>

                                    <Flex gap={4} justify="center">
                                        <Button onClick={() => router.push('/quiz')}>Faire un quiz</Button>
                                        <Button variant="outline" onClick={() => router.push('/notes')}>
                                            Explorer les fiches
                                        </Button>
                                    </Flex>
                                </VStack>
                            </EmptyState.Content>
                        </EmptyState.Root>
                    ) : (
                        <>
                            {/* chart */}
                            <Flex justify="center" mb={8}>
                                <ResponsiveContainer height={360}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="subjectId" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#38A169"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Flex>

                            {/* table */}
                            <Box overflowX="auto">
                                <Table.Root variant="outline">
                                    <Table.Caption>Historique par matière</Table.Caption>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader>Matière</Table.ColumnHeader>
                                            <Table.ColumnHeader >Tentatives</Table.ColumnHeader>
                                            <Table.ColumnHeader>Meilleure note</Table.ColumnHeader>
                                            <Table.ColumnHeader>Dernière tentative</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>

                                    <Table.Body>
                                        {tableRows.map((r) => (
                                            <Table.Row key={r.subjectId}>
                                                <Table.Cell>{r.subjectId}</Table.Cell>
                                                <Table.Cell>{r.attempts}</Table.Cell>
                                                <Table.Cell>{r.best}</Table.Cell>
                                                <Table.Cell>
                                                    {new Date(r.last).toLocaleDateString('fr-FR', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            </Box>
                        </>
                    )}
                </GridItem>

                {/* ================= RIGHT SIDEBAR ======================= */}
                <GridItem>
                    <Stack gap={6}>
                        {/* streak */}
                        <Card.Root p={4} rounded="lg"></Card.Root>
                        <Heading size="md" mb={3}>
                            Votre progression
                        </Heading>
                        {/* Use initialStreak prop */}
                        <StreakTracker days={initialStreak} />
                        <Text mt={3} textAlign="center">
                            {/* Use initialStreak prop */}
                            {initialStreak} jours de révision consécutifs !
                        </Text>

                        {/* upsell */}
                        {!isPro && (
                            <Card.Root
                                p={4}
                                rounded="lg"
                                bgGradient="linear(to-r, blue.400, purple.500)"
                                color="white"
                            >
                                <Heading size="md" mb={3}>
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

                        {/* badges */}
                        <Card.Root p={4} rounded="lg">
                            <Heading size="md" mb={3}>
                                Vos badges
                            </Heading>
                            <SimpleGrid columns={3} gap={3}>
                                <AchievementBadge title="Premier quiz" icon="🏆" achieved />
                                <AchievementBadge
                                    title="5 jours consécutifs"
                                    icon="🔥"
                                    // Use initialStreak prop
                                    achieved={initialStreak >= 5}
                                />
                                <AchievementBadge title="Expert" icon="🎓" achieved={false} />
                            </SimpleGrid>
                        </Card.Root>
                    </Stack>
                </GridItem>
            </Grid>
        </Box >
    );
}

/* ------------------------------------------------------------------ *
 *                          tiny helpers                              *
 * ------------------------------------------------------------------ */
function SectionTitle({
    title,
    ctaLabel,
    onCta,
}: {
    title: string;
    ctaLabel: string;
    onCta: () => void;
}) {
    return (
        <Flex justify="space-between" align="center" mb={4}>
            <Heading size="lg">{title}</Heading>
            <Button
                variant="ghost"
                colorScheme="blue"
                onClick={onCta}
            >
                <FiArrowRight />
                {ctaLabel}
            </Button>
        </Flex>
    );
}

function ActivityCard({
    title,
    desc,
    icon,
    color,
    route,
}: {
    title: string;
    desc: string;
    icon: any;
    color: string;
    route: string;
}) {
    const router = useRouter();
    return (
        <Card.Root p={5} rounded="lg">
            <Flex direction="column" h="full">
                <Icon as={icon} boxSize={8} color={`${color}.500`} mb={3} />
                <Heading size="md" mb={2}>
                    {title}
                </Heading>
                <Text flex="1" mb={4}>
                    {desc}
                </Text>
                <Button
                    colorScheme={color}
                    mt="auto"
                    onClick={() => router.push(route)}
                >
                    Commencer
                </Button>
            </Flex>
        </Card.Root>
    );
}


