'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { updateUserStreak } from '../../../oral-3/actions';
import { db } from '@/lib/firebase/clientApp';
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';
import { AttemptQuiz, Question } from '@/types/Quiz';

/**
 * Saves the completed quiz results and updates the user's streak.
 */
export async function saveQuizResultsAction(payload: AttemptQuiz) {
    try {

        const { user } = await getAuthenticatedAppForUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const resultsData = {
            ...payload,
            completedAt: serverTimestamp(), // Use server timestamp
        };

        // Save the quiz results
        const docRef = await addDoc(collection(db, 'users', user.uid, 'quizResults'), resultsData);
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
export async function saveQuizProgressAction(
    exam: number,
    quizId: string,
    currentQuestionIndex: number,
    currentScore: number,
    currentResults: Question[]) {
    try {
        const { user } = await getAuthenticatedAppForUser(); // Assuming this function gets the authenticated user

        if (!user) {
            throw new Error('User not authenticated');
        }

        const docRef = await addDoc(collection(db, 'users', user.uid, `ecrit-${exam}`), {
            quizId,
            currentQuestionIndex,
            currentScore,
            currentResults,
            lastUpdated: serverTimestamp()
        });

        console.log("Quiz progress saved with ID: ", docRef.id);
        return { success: true, progressId: docRef.id };

    } catch (error) {
        console.error('Error saving quiz progress:', error);
        return { success: false, error: (error as Error).message };
    }
}
