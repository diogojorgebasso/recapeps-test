'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { headers } from 'next/headers';
import { updateUserStreak } from '../../../oral-3/actions';
import { db } from '@/lib/firebase/clientApp';

interface QuestionResult {
    questionId: string;
    selectedAnswer: number[];
    timeSpent: number; // Time in milliseconds
}

interface QuizResultPayload {
    subjectId: string;
    score: number;
    totalQuestions: number;
    questions: QuestionResult[];
}

/**
 * Saves the completed quiz results and updates the user's streak.
 */
export async function saveQuizResultsAction(payload: QuizResultPayload) {
    try {

        const uid = (await headers()).get('X-User-ID'); // Get the specific header value

        if (!uid) {
            throw new Error('User not authenticated');
        }


        const resultsData = {
            ...payload,
            userId: uid,
            date: serverTimestamp(), // Use server timestamp
        };

        // Save the quiz results
        const docRef = await addDoc(collection(db, 'users', uid, 'quizResults'), resultsData);
        console.log("Quiz results saved with ID: ", docRef.id);

        // Update the user's streak after successfully saving results
        const streakUpdateResult = await updateUserStreak();
        if (!streakUpdateResult.success) {
            console.error("Failed to update user streak:", streakUpdateResult.error);
            // Decide if failure to update streak should be a hard error
        } else {
            console.log("User streak updated:", streakUpdateResult.streak);
        }

        return { success: true, resultId: docRef.id, streak: streakUpdateResult.streak };

    } catch (error) {
        console.error('Error saving quiz results:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Placeholder action for saving quiz progress to resume later.
 * Implementation details (what/how to save) depend on requirements.
 */
export async function saveQuizProgressAction(subjectId: string, currentQuestionIndex: number, currentScore: number, currentResults: QuestionResult[]) {
    try {
        const uid = (await headers()).get('X-User-ID'); // Get the specific header value

        if (!uid) {
            throw new Error('User not authenticated');
        }

        console.log("Attempting to save progress for later:", {
            userId: uid,
            subjectId,
            currentQuestionIndex,
            currentScore,
            currentResultsCount: currentResults.length,
        });

        // TODO: Implement actual saving logic to Firestore
        // e.g., save to a specific 'inProgressQuizzes' collection or update user progress document

        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async operation

        return { success: true, message: "Progress saving initiated (placeholder)." };

    } catch (error) {
        console.error('Error saving quiz progress:', error);
        return { success: false, error: (error as Error).message };
    }
}
