import { getQuizForAttempt } from "@/services/QuizService";
import QuizComponent from './QuizComponent';
import { headers } from "next/headers";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const isPro = (await headers()).get('X-User-Pro') === 'true'
    const uid = (await headers()).get('X-User-ID') || ''

    const attemptQuiz = await getQuizForAttempt(1, id, uid);

    // Handle the case where the quiz attempt might be null (e.g., base quiz not found)
    if (!attemptQuiz) {
        // You might want to redirect or show a more specific error message
        return <div>Quiz not found or could not be started.</div>;
    }

    if (attemptQuiz.premium && !isPro) {
        return <div>Ce quiz est réservé aux utilisateurs Pro.</div>;
    }


    return (
        <QuizComponent
            // Pass the fetched attempt data to the client component
            quiz={attemptQuiz}
        />
    );
}
