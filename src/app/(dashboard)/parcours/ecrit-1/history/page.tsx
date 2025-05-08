import { findCompletedAttempts } from '@/repositories/quizRepo'; // Assuming fetchQuizHistory exists and returns AttemptQuiz[] or similar
import { AttemptQuiz } from '@/types/Quiz'; // Import relevant types
import Link from 'next/link';
import {
    Heading,
    Text,
    Alert,
    List,
    Flex,
    Spacer,
    Tag,
    Container
} from '@chakra-ui/react';
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';

export default async function QuizHistoryPage() {
    const { user } = await getAuthenticatedAppForUser();
    let error: string | null = null;
    const quizHistory: Array<AttemptQuiz> = await findCompletedAttempts(user?.uid, 1, 10);

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
                <Text>You haven't completed any quizzes yet.</Text>
            )}

            <List.Root gap={4}>
                {quizHistory.map((item) => {
                    return (
                        <List.Item key={displayData.id} borderWidth="1px" borderRadius="lg" p={4} boxShadow="sm" bg="white">
                            <Flex alignItems="center"> {/* Use Chakra Flex for layout */}
                                <Heading as="h2" size="md" fontWeight="semibold">{displayData.title}</Heading>
                                <Spacer /> {/* Use Chakra Spacer */}
                                <Tag.Root
                                    size="lg"
                                    variant="subtle"
                                    colorScheme={isGoodScore ? 'green' : 'red'} // Conditional color scheme
                                    fontWeight="bold"
                                >
                                    <Tag.Label></Tag.Label>
                                </Tag.Root>
                            </Flex>
                            {displayData.date && (
                                <Text fontSize="sm" color="gray.500" mt={1}>
                                    Completed on: { }
                                </Text>
                            )}
                            <Link href={`/ecrit-1/quiz/review/${displayData.id}`} color="blue.600" _hover={{ textDecoration: 'underline' }} fontSize="sm" mt={2} display="inline-block">
                                Review Attempt
                            </Link>
                        </List.Item>
                    );
                })}
            </List.Root>
        </Container>
    );
}