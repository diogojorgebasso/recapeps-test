'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    SimpleGrid,
    Heading,
    Text,
    Flex,
    Spinner,
    Button,
    useColorModeValue,
    Alert,
    AlertIcon,
    AlertDescription
} from '@chakra-ui/react';
import { getSubjects, getQuizzes, completeQuiz } from '../actions/firestoreQueries';
import { Subject, Quiz } from '../../types';
import SubjectCard from '../../components/SubjectCard';
import StreakTracker from '../../components/StreakTracker';
import PathProgress from '../../components/PathProgress';
import { FaBook, FaGamepad } from 'react-icons/fa';

export default function HomePage() {
    const [activeTab, setActiveTab] = useState(0);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                if (activeTab === 0) {
                    const subjectsData = await getSubjects(userId);
                    setSubjects(subjectsData);
                } else {
                    const quizzesData = await getQuizzes(userId);
                    setQuizzes(quizzesData);
                }
            } catch (err) {
                setError("Une erreur s'est produite lors du chargement des données.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [activeTab]);

    const handleQuizSelect = async (quizId: string) => {
        try {
            // In a real app, this would navigate to the quiz page
            // For now, we'll just mark it as completed
            await completeQuiz(userId, quizId);

            // Refresh quizzes
            const refreshedQuizzes = await getQuizzes(userId);
            setQuizzes(refreshedQuizzes);
        } catch (err) {
            console.error("Failed to complete quiz:", err);
        }
    };

    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');

    return (
        <Box bg={bgColor} minH="100vh" py={10}>
            <Container maxW="container.xl">
                <Flex direction="column" mb={6}>
                    <Heading as="h1" size="xl" mb={2}>
                        RecapEPS
                    </Heading>
                    <Text color="gray.600">
                        Améliorez vos connaissances en éducation physique et sportive
                    </Text>
                </Flex>

                <StreakTracker userId={userId} />

                <Tabs
                    variant="soft-rounded"
                    colorScheme="blue"
                    onChange={(index) => setActiveTab(index)}
                    mb={6}
                >
                    <TabList mb={4}>
                        <Tab fontWeight="medium" leftIcon={<FaBook />}>Matières</Tab>
                        <Tab fontWeight="medium" leftIcon={<FaGamepad />}>Quiz</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel px={0}>
                            {loading ? (
                                <Flex justify="center" py={10}>
                                    <Spinner size="xl" color="blue.500" />
                                </Flex>
                            ) : error ? (
                                <Alert status="error" borderRadius="lg">
                                    <AlertIcon />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : subjects.length === 0 ? (
                                <Box textAlign="center" py={10}>
                                    <Text fontSize="lg" mb={4}>Aucune matière disponible pour le moment.</Text>
                                    <Button colorScheme="blue">Actualiser</Button>
                                </Box>
                            ) : (
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                    {subjects.map((subject) => (
                                        <SubjectCard key={subject.id} subject={subject} />
                                    ))}
                                </SimpleGrid>
                            )}
                        </TabPanel>

                        <TabPanel px={0}>
                            {loading ? (
                                <Flex justify="center" py={10}>
                                    <Spinner size="xl" color="blue.500" />
                                </Flex>
                            ) : error ? (
                                <Alert status="error" borderRadius="lg">
                                    <AlertIcon />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : quizzes.length === 0 ? (
                                <Box textAlign="center" py={10}>
                                    <Text fontSize="lg" mb={4}>Aucun quiz disponible pour le moment.</Text>
                                    <Button colorScheme="blue">Actualiser</Button>
                                </Box>
                            ) : (
                                <Box
                                    bg={cardBg}
                                    borderRadius="xl"
                                    p={6}
                                    boxShadow="md"
                                >
                                    <Heading as="h2" size="md" mb={6} textAlign="center">
                                        Parcours d'apprentissage
                                    </Heading>
                                    <PathProgress
                                        quizzes={quizzes}
                                        onQuizSelect={handleQuizSelect}
                                    />
                                </Box>
                            )}
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Container>
        </Box>
    );
}
