'use server';

import { collection, doc, getDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { getAuthenticatedAppForUser } from '@/lib/firebase/serverApp';

interface Subject {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

interface UserProgress {
  subjectId: string;
  progress: number;
  lastAccessed?: Timestamp;
}

interface StreakData {
  currentStreak: number;
  lastLoginDate: Timestamp;
  longestStreak: number;
}

/**
 * Fetch subjects with user progress data
 */
export async function fetchSubjectsWithProgress() {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();

    if (!currentUser) {
      return { subjects: [], error: 'User not authenticated' };
    }

    const { getFirestore } = await import('firebase/firestore');
    const db = getFirestore(firebaseServerApp);

    // Fetch all subjects
    const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
    const subjects: Subject[] = [];

    subjectsSnapshot.forEach((doc) => {
      subjects.push({
        id: doc.id,
        ...doc.data() as Subject
      });
    });

    // Fetch user progress for each subject
    const userProgressSnapshot = await getDocs(
      collection(db, 'users', currentUser.uid, 'progress')
    );

    const progressMap: Record<string, number> = {};

    userProgressSnapshot.forEach((doc) => {
      const progress = doc.data() as UserProgress;
      progressMap[progress.subjectId] = progress.progress;
    });

    // Combine subjects with progress
    const subjectsWithProgress = subjects.map((subject) => ({
      ...subject,
      progress: progressMap[subject.id] || 0
    }));

    return { subjects: subjectsWithProgress };
  } catch (error) {
    console.error('Error fetching subjects with progress:', error);
    return { subjects: [], error: (error as Error).message };
  }
}

/**
 * Fetch user streak data
 */
export async function fetchUserStreak() {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();

    if (!currentUser) {
      return { streak: { currentStreak: 0, longestStreak: 0 }, error: 'User not authenticated' };
    }

    const { getFirestore } = await import('firebase/firestore');
    const db = getFirestore(firebaseServerApp);

    const streakDocRef = doc(db, 'users', currentUser.uid, 'stats', 'streak');
    const streakSnapshot = await getDoc(streakDocRef);

    if (!streakSnapshot.exists()) {
      return { streak: { currentStreak: 0, longestStreak: 0 } };
    }

    const streakData = streakSnapshot.data() as StreakData;

    return {
      streak: {
        currentStreak: streakData.currentStreak || 0,
        longestStreak: streakData.longestStreak || 0,
        lastLoginDate: streakData.lastLoginDate
      }
    };
  } catch (error) {
    console.error('Error fetching user streak:', error);
    return { streak: { currentStreak: 0, longestStreak: 0 }, error: (error as Error).message };
  }
}


/**
 * Update user streak
 */
export async function updateUserStreak() {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();

    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const { getFirestore, serverTimestamp, setDoc } = await import('firebase/firestore');
    const db = getFirestore(firebaseServerApp);

    const streakDocRef = doc(db, 'users', currentUser.uid, 'stats', 'streak');
    const streakSnapshot = await getDoc(streakDocRef);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today

    let currentStreak = 0;
    let longestStreak = 0;
    let updateNeeded = false;
    let lastLoginDate: Date | null = null;

    if (streakSnapshot.exists()) {
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
          // Last login was yesterday, increment streak
          currentStreak++;
          updateNeeded = true;
        } else if (diffDays > 1) {
          // Last login was before yesterday, reset streak
          currentStreak = 1;
          updateNeeded = true;
        }
        // If diffDays === 0 (logged in today already), do nothing to currentStreak, but update lastLoginDate
        if (diffDays >= 0) {
          updateNeeded = true; // Always update lastLoginDate if login is today or yesterday
        }

      } else {
        // No last login date, start streak
        currentStreak = 1;
        updateNeeded = true;
      }
    } else {
      // No streak document exists, start streak
      currentStreak = 1;
      longestStreak = 1;
      updateNeeded = true;
    }

    // Update longest streak if current is greater
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Update streak document only if needed
    if (updateNeeded) {
      await setDoc(streakDocRef, {
        currentStreak,
        longestStreak,
        lastLoginDate: serverTimestamp() // Use serverTimestamp for consistency
      }, { merge: true }); // Use merge: true to avoid overwriting other potential fields
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
