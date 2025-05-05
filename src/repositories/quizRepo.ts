import {
    collection, query, orderBy, limit, getDocs, doc, getDoc, where, addDoc, serverTimestamp, DocumentReference, Timestamp, DocumentData
} from "firebase/firestore";

import { db } from "@/lib/firebase/clientApp";
// Import QuizTrail
import { Quiz, Question, AttemptQuiz, QuizTrail } from "@/types/Quiz";

/**
 * Finds an active (state === 'doing') quiz attempt for a user.
 */
export async function findActiveAttempt(numberOfEcrit: number, quizId: string, uid: string): Promise<AttemptQuiz | null> {
    try {
        const userQuizAttemptsRef = collection(db, "users", uid, `ecrit-${numberOfEcrit}`);
        const activeQuizQuery = query(
            userQuizAttemptsRef,
            where("quizRef", "==", doc(db, `ecrit-${numberOfEcrit}`, quizId)),
            where("state", "==", "doing"),
            limit(1)
        );
        const activeQuizSnapshot = await getDocs(activeQuizQuery);

        if (!activeQuizSnapshot.empty) {
            const quizDoc = activeQuizSnapshot.docs[0];
            const data = quizDoc.data();
            return {
                id: quizDoc.id,
                ...data,
            } as AttemptQuiz;
        }
        return null;
    } catch (error) {
        console.error("Error finding active quiz attempt:", error);
        throw new Error(`Failed to find active quiz attempt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Fetches the base definition of a quiz.
 */
export async function fetchBaseQuiz(numberOfEcrit: number, quizId: string): Promise<Quiz | null> {
    try {
        const quizDocRef = doc(db, `ecrit-${numberOfEcrit}`, quizId);
        const quizSnapshot = await getDoc(quizDocRef);

        if (quizSnapshot.exists()) {
            const data = quizSnapshot.data();
            return {
                id: quizSnapshot.id,
                name: data.name,
                level: data.level,
                premium: data.premium,
                questions: data.questions as Question[],
            } as Quiz;
        }
        return null;
    } catch (error) {
        console.error("Error fetching base quiz:", error);
        throw new Error(`Failed to fetch base quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Fetches the IDs of questions already answered by the user for a specific quiz.
 */
export async function fetchUserAnsweredQuestionIds(numberOfEcrit: number, quizId: string, uid: string): Promise<Set<string>> {
    try {
        const progressDocRef = doc(db, "users", uid, `ecrit-${numberOfEcrit}`, "progressOverview", "quizzes", quizId);
        const userProgressSnapshot = await getDoc(progressDocRef);

        if (userProgressSnapshot.exists()) {
            return new Set<string>(userProgressSnapshot.data()?.questions || []);
        }
        return new Set<string>(); // Return empty set if no progress doc exists
    } catch (error) {
        console.error("Error fetching user answered questions:", error);
        throw new Error(`Failed to fetch user answered questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Creates a new quiz attempt document for the user.
 */
export async function createAttempt(
    numberOfEcrit: number,
    uid: string,
    attemptData: Omit<AttemptQuiz, "id" | "createdAt"> // Exclude id and createdAt from the data to be passed
): Promise<AttemptQuiz> {
    try {
        const userQuizAttemptsRef = collection(db, "users", uid, `ecrit-${numberOfEcrit}`);
        const newAttemptRef = await addDoc(userQuizAttemptsRef, attemptData);

        // Fetch the newly created document to get the server-generated timestamp and return the full object
        const newAttemptSnapshot = await getDoc(newAttemptRef);
        if (!newAttemptSnapshot.exists()) {
            throw new Error("Failed to fetch newly created attempt document.");
        }
        const data = newAttemptSnapshot.data();

        return {
            id: newAttemptRef.id,
            createdAt: data.createdAt as Timestamp,
            quizRef: data.quizRef as DocumentReference<DocumentData>,
            premium: data.premium,
            state: data.state,
            questions: data.questions as Question[],
            score: data.score,
        } as AttemptQuiz;

    } catch (error) {
        console.error("Error creating quiz attempt:", error);
        throw new Error(`Failed to create quiz attempt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Update return type and add type assertion
export async function getProgressOverview(uid: string, numberOfEcrit: number): Promise<Record<string, QuizTrail> | null> {
    const progressOverviewRef = doc(db, "users", uid, `ecrit-${numberOfEcrit}`, "progressOverview");
    const progressOverviewSnapshot = await getDoc(progressOverviewRef);
    if (progressOverviewSnapshot.exists()) {
        // Assert the data type
        return progressOverviewSnapshot.data() as Record<string, QuizTrail>;
    }
    return null; // or handle the case where the document doesn't exist
}

/**
 * Fetches completed quiz attempts for a user.
 * Note: The return type might need adjustment based on what 'history' means (e.g., AttemptQuiz[], or a simpler QuizResult[] type).
 */
export async function findCompletedAttempts(uid: string, numberOfEcrit: number, limitResult: number = 5): Promise<AttemptQuiz[]> {
    try {
        // Assuming attempts are stored per-subject (ecrit-X)
        const userAttemptsRef = collection(db, "users", uid, `ecrit-${numberOfEcrit}`);

        const completedQuizzesQuery = query(
            userAttemptsRef,
            where("state", "==", "completed"),
            orderBy("createdAt", "desc"), // Assuming createdAt exists and is indexed
            limit(limitResult)
        );

        const completedQuizzesSnapshot = await getDocs(completedQuizzesQuery);

        const quizHistory = completedQuizzesSnapshot.docs.map(doc => {
            const data = doc.data();
            // Map to AttemptQuiz, ensure all fields match the interface
            return {
                id: doc.id,
                quizRef: data.quizRef as DocumentReference<DocumentData>,
                title: data.title,
                level: data.level,
                premium: data.premium,
                state: data.state,
                questions: data.questions as Question[],
                createdAt: data.createdAt as Timestamp,
                score: data.score, // Include score if available
                completedAt: data.completedAt as Timestamp | undefined, // Include completion time if available
                // Add other relevant fields from the attempt document
            } as AttemptQuiz; // Cast carefully
        });

        return quizHistory;

    } catch (error) {
        console.error("Error fetching quiz history:", error);
        throw new Error(`Failed to fetch quiz history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}