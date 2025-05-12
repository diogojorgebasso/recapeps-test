import {
    Heading,
    Container
} from '@chakra-ui/react';
import QuizComponent from './QuizComponent'; // Adjust the import path as necessary
import { findCompletedAttempts } from '@/repositories/quizRepo'; // Assuming fetchQuizHistory exists and returns AttemptQuiz[] or similar
import { getFirestore } from 'firebase/firestore';
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';


export default async function QuizHistoryPage() {
    const { firebaseServerApp, user } = await getAuthenticatedAppForUser();

    if (!user) {
        return <div>Faire le login</div>;
    }

    const quizHistory = await findCompletedAttempts(
        getFirestore(firebaseServerApp), user.uid, 1, 10);

    return (
        <Container maxW="container.lg" p={4}>
            <Heading as="h1" size="lg" mb={6}>Quiz History</Heading>
            <QuizComponent quizHistory={quizHistory} />
        </Container>
    );
}