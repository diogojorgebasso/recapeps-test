'use server';

import { db } from '@/lib/firebase/serverApp';
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';
import { AttemptedQuestion, QuizState, QuizAttemptDonePayload } from '@/types/Quiz';
import { Timestamp } from 'firebase-admin/firestore';

// Define the structure for streak data in Firestore
interface StreakData {
    currentStreak?: number;
    longestStreak?: number;
    lastLoginDate?: {
        toDate: () => Date;
    };
}

/**
 * Saves the completed quiz results and updates the user's streak.
 */
export async function saveQuizResultsAction(payload: QuizAttemptDonePayload) {
    try {
        const { user } = await getAuthenticatedAppForUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const now = Timestamp.now()
        const resultsData = {
            state: 'completed' as QuizState,
            completedAt: now,
            ...payload
        };
        await db.collection('users').doc(user.uid).collection('ecrit-1').doc(payload.id).set(resultsData);

        // outra lógica.
        const streakUpdateResult = await updateUserStreak();
        if (!streakUpdateResult.success) {
            console.error("Failed to update user streak:", streakUpdateResult.error);
        } else {
            console.log("User streak updated:", streakUpdateResult.streak);
        }

        return { success: true, streak: streakUpdateResult.streak };

    } catch (error) {
        console.error('Error saving quiz results:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Placeholder action for saving quiz progress to resume later.
 */
export async function saveQuizProgressAction(
    exam: number,
    quizId: string,
    currentQuestionIndex: number,
    currentScore: number,
    currentResults: AttemptedQuestion[]) {
    try {
        const { user } = await getAuthenticatedAppForUser();

        if (!user) {
            throw new Error('User not authenticated');
        }

        const docRef = await db.collection('users').doc(user.uid).collection(`ecrit-${exam}`).add({
            quizId,
            currentQuestionIndex,
            currentScore,
            currentResults,
            lastUpdated: Timestamp.now()
        });

        console.log("Quiz progress saved with ID: ", docRef.id);
        return { success: true, progressId: docRef.id };

    } catch (error) {
        console.error('Error saving quiz progress:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Update user streak
 */
async function updateUserStreak() {
    try {
        const { user } = await getAuthenticatedAppForUser();
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        const streakDocRef = db.collection('users').doc(user.uid).collection('stats').doc('streak');
        const streakSnapshot = await streakDocRef.get();

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let currentStreak = 0;
        let longestStreak = 0;
        let updateNeeded = false;
        let lastLoginDate: Date | null = null;

        if (streakSnapshot.exists) {
            const streakData = streakSnapshot.data() as StreakData;
            currentStreak = streakData.currentStreak || 0;
            longestStreak = streakData.longestStreak || 0;
            if (streakData.lastLoginDate) {
                lastLoginDate = streakData.lastLoginDate.toDate();
            }

            if (lastLoginDate) {
                const lastLoginDay = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate());
                const diffTime = today.getTime() - lastLoginDay.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    currentStreak++;
                    updateNeeded = true;
                } else if (diffDays > 1) {
                    currentStreak = 1;
                    updateNeeded = true;
                }
                if (diffDays >= 0) {
                    updateNeeded = true;
                }

            } else {
                currentStreak = 1;
                updateNeeded = true;
            }
        } else {
            currentStreak = 1;
            longestStreak = 1;
            updateNeeded = true;
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        if (updateNeeded) {
            await streakDocRef.set({
                currentStreak,
                longestStreak,
                lastLoginDate: Timestamp.now()
            }, { merge: true });
        }

        return {
            success: true,
            streak: { currentStreak, longestStreak }
        };
    } catch (error) {
        console.error('Error updating user streak:', error);
        return { success: false, error: (error as Error).message };
    }
}
