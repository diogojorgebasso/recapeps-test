import {
    Heading,
    Container
} from '@chakra-ui/react';
import QuizComponent from './QuizComponent';
import { findCompletedAttempts } from '@/repositories/quizRepo';
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';

export default async function QuizHistoryPage() {
    const { user } = await getAuthenticatedAppForUser();

    if (!user) {
        return <div>Faire le login</div>;
    }

    const quizHistory = await findCompletedAttempts({
        uid: user.uid,
        numberOfEcrit: 1,
        limitResult: 10
    });

    return (
        <Container maxW="container.lg" p={4}>
            <Heading as="h1" size="lg" mb={6}>Quiz History</Heading>
            <QuizComponent quizHistory={quizHistory} />
        </Container>
    );
}