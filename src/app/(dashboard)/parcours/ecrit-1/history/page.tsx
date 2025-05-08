import { findCompletedAttempts } from '@/repositories/quizRepo'; // Assuming fetchQuizHistory exists and returns AttemptQuiz[] or similar
import Link from 'next/link';
import {
    Heading,
    Text,
    Alert,
    List,
    Flex,
    Spacer,
    Badge,
    Container
} from '@chakra-ui/react';
import { requireAuth } from '@/lib/firebase/auth-protection';

export default async function QuizHistoryPage() {
    const user = await requireAuth();
    let error: string | null = null;
    const quizHistory = await findCompletedAttempts(user?.uid, 1, 10);

    return (
        <Container maxW="container.lg" p={4}>
            <Heading as="h1" size="lg" mb={6}>Quiz History</Heading>

            {error && (
                <Alert.Root status="error" mb={4} borderRadius="md">
                    <Alert.Indicator />
                    <Alert.Description>{error}</Alert.Description>
                </Alert.Root>
            )}

            {quizHistory.length === 0 && !error && (
                <Text>Vous n&apos;avez pas fait un quiz.</Text>
            )}

            <List.Root gap={4}>
                {quizHistory.map(({ id, name, score, completedAt }) => {
                    return (
                        <List.Item key={id} borderWidth="1px" borderRadius="lg" p={4} boxShadow="sm" bg="white">
                            <Flex alignItems="center"> {/* Use Chakra Flex for layout */}
                                <Heading as="h2" size="md" fontWeight="semibold">{name}</Heading>
                                <Spacer /> {/* Use Chakra Spacer */}
                                <Badge
                                    size="lg"
                                    variant="subtle"
                                    colorPalette={score > 4 ? 'green' : 'red'} // Conditional color scheme
                                    fontWeight="bold"
                                >
                                    {score} / 8
                                </Badge>
                            </Flex>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                                Completed on: {completedAt.toDate().toLocaleDateString()}
                            </Text>
                            <Link href={`/ecrit-1/quiz/attempt/${id}`} color="blue.600">
                                Review Attempt
                            </Link>
                        </List.Item>
                    );
                })}
            </List.Root>
        </Container>
    );
}