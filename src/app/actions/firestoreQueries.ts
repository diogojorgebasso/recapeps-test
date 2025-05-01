'use server';

import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
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
 * Fetch recent activities for the user
 */
export async function fetchRecentActivities(limit = 5) {
  try {
    const { firebaseServerApp, currentUser } = await getAuthenticatedAppForUser();

    if (!currentUser) {
      return { activities: [], error: 'User not authenticated' };
    }

    const { getFirestore } = await import('firebase/firestore');
    const db = getFirestore(firebaseServerApp);

    const activitiesQuery = query(
      collection(db, 'users', currentUser.uid, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );

    const activitiesSnapshot = await getDocs(activitiesQuery);
    const activities: any[] = [];

    activitiesSnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { activities };
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return { activities: [], error: (error as Error).message };
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

    const { getFirestore, serverTimestamp } = await import('firebase/firestore');
    const db = getFirestore(firebaseServerApp);

    const streakDocRef = doc(db, 'users', currentUser.uid, 'stats', 'streak');
    const streakSnapshot = await getDoc(streakDocRef);

    const now = new Date();
    let currentStreak = 1;
    let longestStreak = 1;

    if (streakSnapshot.exists()) {
      const streakData = streakSnapshot.data() as StreakData;
      const lastLogin = streakData.lastLoginDate?.toDate();
      longestStreak = streakData.longestStreak || 0;

      if (lastLogin) {
        // Check if last login was yesterday or today
        const lastLoginDate = lastLogin.getDate();
        const today = now.getDate();
        const isConsecutive = (today - lastLoginDate === 1) || (today === lastLoginDate);

        if (isConsecutive) {
          // Continue the streak
          currentStreak = (streakData.currentStreak || 0) + 1;
        } else {
          // Reset the streak
          currentStreak = 1;
        }
      }

      // Update longest streak if current is longer
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    }

    // Update streak document
    await streakDocRef.set({
      currentStreak,
      longestStreak,
      lastLoginDate: serverTimestamp()
    });

    return {
      success: true,
      streak: { currentStreak, longestStreak }
    };
  } catch (error) {
    console.error('Error updating user streak:', error);
    return { success: false, error: (error as Error).message };
  }
}
