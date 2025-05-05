import { db } from "@/lib/firebase/clientApp";
import { doc } from "firebase/firestore";
import { AttemptQuiz, QuizState } from "@/types/Quiz";
import {
    findActiveAttempt, fetchBaseQuiz,
    createAttempt, findCompletedAttempts
} from "@/repositories/quizRepo";

/**
 * Fetches the appropriate quiz data for a user attempt.
 * It checks for an active attempt first. If none exists, it fetches the base quiz
 * definition and filters out already answered questions to start a new attempt.
 */
export async function getQuizForAttempt(numberOfEcrit: number, quizId: string, uid: string): Promise<AttemptQuiz | null> {
    try {
        // 1. Check for an active attempt
        let attempt = await findActiveAttempt(numberOfEcrit, quizId, uid);
        if (attempt) {
            console.log("Found active attempt:", attempt.id);
            return attempt;
        }

        // 2. No active attempt, fetch the base quiz definition
        const baseQuiz = await fetchBaseQuiz(numberOfEcrit, quizId);
        if (!baseQuiz) {
            console.error(`Base quiz not found for ecrit-${numberOfEcrit}, quizId: ${quizId}`);
            return null; // Or throw an error if a quiz should always exist
        }

        // 3. Fetch IDs of questions the user has already answered correctly for this quiz
        //    (Assuming progress is stored elsewhere, e.g., user's progress subcollection)
        //    This part might need adjustment based on how progress/answered questions are tracked.
        //    For now, let's assume we start fresh or fetch from a specific progress doc.
        //    const answeredQuestionIds = await quizRepo.fetchUserAnsweredQuestionIds(numberOfEcrit, quizId, uid);

        // 4. Filter base quiz questions (if needed - e.g., remove already answered ones)
        //    const filteredQuestions = baseQuiz.questions.filter(q => !answeredQuestionIds.has(q.id)); // Assuming Question has an 'id'
        //    If no filtering is needed for a new attempt, use all questions:
        const questionsForAttempt = baseQuiz.questions;


        // 5. Create a new attempt document in Firestore
        const newAttemptData = {
            quizRef: doc(db, `ecrit-${numberOfEcrit}`, quizId), // Reference to the base quiz
            name: baseQuiz.name,
            state: "doing" as QuizState,
            questions: questionsForAttempt,
            score: 0,
            premium: baseQuiz.premium, // Assuming baseQuiz has a property indicating if it's Pro-only
        };

        attempt = await createAttempt(numberOfEcrit, uid, newAttemptData);
        console.log("Created new attempt:", attempt.id);

        return attempt;

    } catch (error) {
        console.error("Error in getQuizForAttempt service:", error);
        // Depending on requirements, you might want to return null or re-throw
        throw new Error(`Failed to get or create quiz attempt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Fetches the history of completed quiz attempts for a user.
 */
export async function getQuizHistory(uid: string, numberOfEcrit: number, limit: number = 5): Promise<AttemptQuiz[]> {
    try {
        const history = await findCompletedAttempts(uid, numberOfEcrit, limit);
        return history;
    } catch (error) {
        console.error("Error fetching quiz history in service:", error);
        throw new Error(`Failed to fetch quiz history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Add other quiz-related business logic functions here, e.g.:
// export async function submitAnswer(attemptId: string, questionId: string, answer: string, uid: string): Promise<void> { ... }
// export async function completeAttempt(attemptId: string, score: number, uid: string): Promise<void> { ... }
// export function calculateScore(attempt: AttemptQuiz): number { ... }
