"use client";

import { useEffect, useState } from "react";
import {
    Box,
    Heading,
    Table,
    HStack,
    Button,
    Text,
    SimpleGrid,
    Card,
    Spinner,
    Center,
} from "@chakra-ui/react";

import { HiOutlineSparkles } from "react-icons/hi";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import Link from "next/link";
import { findCompletedAttempts } from "@/repositories/quizRepo";
import { QuizDone } from "@/types/Quiz";
import { useUserWithClaims } from "@/lib/getUser";

export default function Page() {
    const { user } = useUserWithClaims();
    const [quizData, setQuizData] = useState<QuizDone[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const currentEcritNumber = 1;

    useEffect(() => {
        const loadData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const completedAttemptsData = await findCompletedAttempts({ uid: user.uid, numberOfEcrit: currentEcritNumber, limitResult: 10 });
                setQuizData(completedAttemptsData);
            } catch (error) {
                console.error("Erreur lors du chargement des données du tableau de bord:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user]);
    console.log("Quiz Data:", quizData);


    const chartData = quizData.map((quiz) => {
        return {
            name: quiz.name || "Inconnu",
            score: quiz.score,
            timestamp: quiz.completedAt.toDate(),
        };
    });

    if (isLoading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    return (
        <Box p={4}>
            {quizData.length > 0 && (
                <>
                    <Heading size="lg" textAlign="center" mb={6}>
                        Vos derniers résultats (Écrit {currentEcritNumber})
                    </Heading>
                    <Box display="flex" justifyContent="center" mb={10} p={4} shadow="md" borderWidth="1px" borderRadius="md">
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    angle={-30}
                                    textAnchor="end"
                                    height={70}
                                    interval={0}
                                    label={{ value: "Quiz (Tentatives récentes)", position: "insideBottom", offset: -5 }}
                                />
                                <YAxis label={{ value: "Score (%)", angle: -90, position: "insideLeft" }} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: "5px" }}
                                    formatter={(value: number, name: string) => [value, name === "score" ? "Score" : name]}
                                />
                                <Legend verticalAlign="top" />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#4caf50"
                                    strokeWidth={2}
                                    dot={{ r: 5 }}
                                    activeDot={{ r: 7 }}
                                    name="Score"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>

                    <Box maxWidth="1000px" mx="auto" py={8}>
                        <Heading size="lg" textAlign="center" mb={6}>
                            Récapitulatif par matière
                        </Heading>
                        <Table.Root variant="outline" size="md">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>Matière</Table.ColumnHeader>
                                    <Table.ColumnHeader>Tentatives</Table.ColumnHeader>
                                    <Table.ColumnHeader>Meilleure Note (%)</Table.ColumnHeader>
                                    <Table.ColumnHeader>Dernière Tentative</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {chartData.map((row, index) => (
                                    <Table.Row key={index}>
                                        <Table.Cell fontWeight="medium">{row.name}</Table.Cell>
                                        <Table.Cell>{row.score}</Table.Cell>
                                        <Table.Cell>
                                            {row.timestamp.toDateString()}
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table.Root>
                    </Box>
                </>
            )}

            <Box maxWidth="1000px" mx="auto" py={8} mt={8}>
                <Heading size="lg" textAlign="center" mb={6}>
                    <HStack justifyContent="center">
                        <HiOutlineSparkles /> <Text>Bonjour {user?.displayName || ""}, que souhaites-tu réviser aujourd&apos;hui</Text>
                    </HStack>
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                    <Card.Root borderWidth="1px" borderRadius="md" shadow="sm" _hover={{ shadow: "md" }}>
                        <Card.Header>
                            <Heading size="md">Oral 1</Heading>
                        </Card.Header>
                        <Card.Body>
                            <Text fontSize="sm" color="gray.500">
                                Préparez-vous pour l&apos;oral 1 avec nos fiches de révision.
                            </Text>
                        </Card.Body>
                        <Card.Footer>
                            <Link href={`/parcours/oral-1`} passHref>
                                <Button colorPalette="green" variant="solid" width="full">
                                    Voir les fiches
                                </Button>
                            </Link>
                        </Card.Footer>
                    </Card.Root>
                    <Card.Root borderWidth="1px" borderRadius="md" shadow="sm" _hover={{ shadow: "md" }}>
                        <Card.Header>
                            <Heading size="md">Oral 3</Heading>
                        </Card.Header>
                        <Card.Body>
                            <Text fontSize="sm" color="gray.500">
                                Préparez-vous pour l&apos;oral 3 avec nos fiches de révision.
                            </Text>
                        </Card.Body>
                        <Card.Footer>
                            <Link href={`/parcours/oral-3#fiches`} passHref>
                                <Button colorPalette="green" variant="solid" width="full">
                                    Voir les fiches
                                </Button>
                            </Link>
                        </Card.Footer>
                    </Card.Root>
                    <Card.Root borderWidth="1px" borderRadius="md" shadow="sm" _hover={{ shadow: "md" }}>
                        <Card.Header>
                            <Heading size="md">Oral 3</Heading>
                        </Card.Header>
                        <Card.Footer>
                            <Link href={`/parcours/oral-3`} passHref>
                                <Button colorPalette="green" variant="solid" width="full">
                                    Faire une simulation
                                </Button>
                            </Link>
                        </Card.Footer>
                    </Card.Root>
                </SimpleGrid>
            </Box>
        </Box>
    );
}
