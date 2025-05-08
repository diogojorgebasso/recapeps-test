import { Timestamp } from "firebase-admin/firestore";

import { Quiz, Question, AttemptQuiz, QuizDone } from "@/types/Quiz";
import { QuizTrail } from "@/types/TreeSkill";
import { db } from "@/lib/firebase/serverApp";

/**
 * Finds an active (state === 'doing') quiz attempt for a user.
 */
export async function findActiveAttempt(numberOfEcrit: number, quizId: string, uid: string): Promise<AttemptQuiz | null> {
    try {
        const userQuizAttemptsRef = db.collection("users").doc(uid).collection(`ecrit-${numberOfEcrit}`);
        const activeQuizQuery = userQuizAttemptsRef
            .where("quizRef", "==", db.doc(`ecrit-${numberOfEcrit}/${quizId}`))
            .where("state", "==", "doing")
            .limit(1);

        const activeQuizSnapshot = await activeQuizQuery.get();

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

        const quizDocRef = db.doc(`ecrit-${numberOfEcrit}/${quizId}`);
        const quizSnapshot = await quizDocRef.get();

        if (quizSnapshot.exists) {
            const data = quizSnapshot.data();
            if (data) {
                return {
                    id: quizSnapshot.id,
                    name: data.name,
                    level: data.level,
                    premium: data.premium,
                    questions: data.questions as Question[],
                } as Quiz;
            }
        }
        return null;
    } catch (error) {
        console.error("Error fetching base quiz:", error);
        throw new Error(`Failed to fetch base quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Fetches the IDs of questions answered incorrectly by the user for a specific quiz,
 * considering only the latest attempt for each question.
 */
export async function fetchUserWrongQuestionIds(numberOfEcrit: number, quizId: string, uid: string): Promise<Set<string>> {
    try {
        const answeredQuestionsRef = db.collection("users").doc(uid).collection(`ecrit-${numberOfEcrit}`);
        const q = answeredQuestionsRef
            .where("state", "==", "completed")
            .where("quizRef", "==", db.doc(`ecrit-${numberOfEcrit}/${quizId}`))
            .orderBy("createdAt", "asc");

        const querySnapshot = await q.get();

        const latestQuestionCorrectness = new Map<string, boolean>();

        querySnapshot.forEach((doc) => {
            const attemptData = doc.data();
            const questionsInAttempt = attemptData.questions;
            for (const question of questionsInAttempt) {
                latestQuestionCorrectness.set(question.id, question.isSelectionCorrect);
            }
        });

        const wrongQuestionsSet = new Set<string>();
        latestQuestionCorrectness.forEach((isCorrect, questionId) => {
            if (!isCorrect) {
                wrongQuestionsSet.add(questionId);
            }
        });

        return wrongQuestionsSet;

    } catch (error) {
        console.error("Error fetching user answered questions:", error);
        throw new Error(`Failed to fetch user answered questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Receives an Parcial Attempt Document, add to DB 
 * and return the values Attempt Document from Server. 
 */
export async function createAttempt(
    numberOfEcrit: number,
    uid: string,
    attemptData: Omit<AttemptQuiz, "id" | "createdAt">
): Promise<AttemptQuiz> {
    try {
        const now = Timestamp.now();

        const userQuizAttemptsRef = db.collection("users").doc(uid).collection(`ecrit-${numberOfEcrit}`);
        const newAttemptRef = await userQuizAttemptsRef.add({
            ...attemptData,
            createdAt: now
        });

        return {
            id: newAttemptRef.id,
            createdAt: now,
            ...attemptData,
        } as AttemptQuiz;

    } catch (error) {
        console.error("Error creating quiz attempt:", error);
        throw new Error(`Failed to create quiz attempt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getProgressOverview(uid: string | undefined, numberOfEcrit: number): Promise<Record<string, QuizTrail> | null> {
    if (!uid) {
        return null;
    }
    try {

        const progressOverviewRef = db.collection("users").doc(uid).collection(`ecrit-${numberOfEcrit}`).doc("progressOverview");
        const progressOverviewSnapshot = await progressOverviewRef.get();

        if (progressOverviewSnapshot.exists) {
            return progressOverviewSnapshot.data() as Record<string, QuizTrail>;
        }
        return null;
    } catch (error) {
        console.error("Error fetching progress overview:", error);
        throw new Error(`Failed to fetch progress overview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Fetches completed quiz attempts for a user.
 */
export async function findCompletedAttempts(uid: string, numberOfEcrit: number, limitResult: number = 5): Promise<QuizDone[]> {
    try {

        const userAttemptsRef = db.collection("users").doc(uid).collection(`ecrit-${numberOfEcrit}`);
        const completedQuizzesQuery = userAttemptsRef
            .where("state", "==", "completed")
            .orderBy("completedAt", "desc")
            .limit(limitResult);

        const completedQuizzesSnapshot = await completedQuizzesQuery.get();

        const quizHistory = completedQuizzesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data
            } as QuizDone;
        });

        return quizHistory;

    } catch (error) {
        console.error("Error fetching quiz history:", error);
        throw new Error(`Failed to fetch quiz history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}