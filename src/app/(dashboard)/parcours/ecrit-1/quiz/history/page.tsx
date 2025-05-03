import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';
import { fetchQuizHistory } from '@/lib/repository/quizRepo'; // Assuming fetchQuizHistory exists and returns AttemptQuiz[] or similar
import { AttemptQuiz } from '@/types/Quiz'; // Import relevant types
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import {
    Box,
    Heading,
    Text,
    Alert,
    List,
    ListItem,
    Flex,
    Spacer,
    Tag,
    Container
} from '@chakra-ui/react'; // Import Chakra UI components


const getDisplayData = (item: AttemptQuiz): { title: string; score: number | string; date: Date | null; id: string } => {
    if ('quizRef' in item && 'state' in item) {
        return {
            id: item.id,
            title: item.title || 'Quiz Attempt',
            score: item.score ?? 'N/A', // Assuming score might be added to AttemptQuiz on completion
            date: item.completedAt instanceof Timestamp ? item.completedAt.toDate() : (item.createdAt instanceof Timestamp ? item.createdAt.toDate() : null) // Prefer completedAt if available
        };
    } else if ('score' in item && 'timestamp' in item) { // Check if it's QuizResult
        return {
            id: item.subjectId + '-' + item.timestamp.seconds, // Create a pseudo-id if none exists
            title: `Quiz on ${item.subjectId}`, // Or fetch title if available
            score: item.score,
            date: item.timestamp instanceof Timestamp ? item.timestamp.toDate() : null
        };
    }
    // Fallback or handle other types if necessary
    return { id: 'unknown', title: 'Unknown Entry', score: 'N/A', date: null };
};

export default async function QuizHistoryPage() {
    const { currentUser } = await getAuthenticatedAppForUser();

    if (!currentUser) {
        return (
            <Container maxW="container.lg" p={4}> {/* Use Chakra Container */}
                <Heading as="h1" size="lg" mb={4}>Quiz History</Heading> {/* Use Chakra Heading */}
                <Text mb={4}>Please log in to view your quiz history.</Text> {/* Use Chakra Text */}
                <Link href="/login" color="blue.600" _hover={{ textDecoration: 'underline' }}>
                    Go to Login
                </Link>
            </Container>
        );
    }

    let quizHistory: Array<AttemptQuiz | QuizResult> = [];
    let error: string | null = null;

    try {
        quizHistory = await fetchQuizHistory(currentUser.uid, 'ecrit-1', 10);
    } catch (err) {
        console.error("Error fetching quiz history:", err);
        error = "Failed to load quiz history. Please try again later.";
    }

    return (
        <Container maxW="container.lg" p={4}> {/* Use Chakra Container */}
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

            {quizHistory.length > 0 && (
                <List.Root gap={4}>
                    {quizHistory.map((item) => {
                        const displayData = getDisplayData(item);
                        const isGoodScore = typeof displayData.score === 'number' && displayData.score >= 50;
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
                                        {typeof displayData.score === 'number' ? `${displayData.score}%` : displayData.score}
                                    </Tag.Root>
                                </Flex>
                                {displayData.date && (
                                    <Text fontSize="sm" color="gray.500" mt={1}>
                                        Completed on: {format(displayData.date, 'PPP p')}
                                    </Text>
                                )}
                                {/* Optional: Add a link to review the attempt if possible */}
                                {/* <Link as={NextLink} href={`/ecrit-1/quiz/review/${displayData.id}`} color="blue.600" _hover={{ textDecoration: 'underline' }} fontSize="sm" mt={2} display="inline-block">
                                    Review Attempt
                                </Link> */}
                            </List.Item>
                        );
                    })}
                </List.Root>
            )}
        </Container>
    );
}