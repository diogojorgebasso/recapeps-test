import { doc, getDoc, Timestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase/clientApp';
import { getAuth } from 'firebase/auth';


interface StreakData {
  currentStreak: number;
  lastLoginDate: Timestamp;
  longestStreak: number;
}

/**
 * Fetch user streak data
 */
export async function fetchUserStreak() {
  try {
    const user = getAuth().currentUser;

    if (!user) {
      return { streak: { currentStreak: 0, longestStreak: 0 }, error: 'User not authenticated' };
    }


    const streakDocRef = doc(db, 'users', user.uid, 'stats', 'streak');
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


