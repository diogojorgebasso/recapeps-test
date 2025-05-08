import { getQuizForAttempt } from "@/services/QuizService";
import QuizComponent from './QuizComponent';
import { requireAuth } from "@/lib/firebase/auth-protection";
import { redirect } from "next/navigation";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { user, isPro } = await requireAuth();

    const attemptQuiz = await getQuizForAttempt(1, id, user.uid);

    if (!attemptQuiz) {
        redirect('/dashboard/parcours/ecrit-1');
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
