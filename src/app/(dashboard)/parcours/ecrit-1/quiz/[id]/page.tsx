import { getQuizForAttempt } from "@/services/QuizService";
import QuizComponent from './QuizComponent';

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const isPro = headers().get('x-user-pro') === 'true'
    const quizAttempt = await getQuizForAttempt(1, id, currentUser.uid);

    // Handle the case where the quiz attempt might be null (e.g., base quiz not found)
    if (!quizAttempt) {
        // You might want to redirect or show a more specific error message
        return <div>Quiz not found or could not be started.</div>;
    }

    return (
        <QuizComponent
            // Pass the fetched attempt data to the client component
            quiz={quizAttempt}
        />
    );
}
