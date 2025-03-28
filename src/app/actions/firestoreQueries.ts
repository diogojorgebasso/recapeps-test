'use server';

import { collection, getDocs, doc, getDoc, updateDoc, setDoc, query, where, increment, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Subject, Quiz, UserStreak } from '../../../types';

export async function getSubjects(userId: string): Promise<Subject[]> {
  try {
    const subjectsRef = collection(db, 'subjects');
    const snapshot = await getDocs(subjectsRef);
    const subjects: Subject[] = [];

    for (const subjectDoc of snapshot.docs) {
      const subjectData = subjectDoc.data();
      
      // Get user progress for this subject
      const progressRef = doc(db, 'userProgress', `${userId}_${subjectDoc.id}`);
      const progressSnap = await getDoc(progressRef);
      const chaptersRead = progressSnap.exists() ? progressSnap.data().chaptersRead : 0;
      
      subjects.push({
        id: subjectDoc.id,
        title: subjectData.title,
        description: subjectData.description,
        imageUrl: subjectData.imageUrl,
        totalChapters: subjectData.totalChapters,
        chaptersRead,
      });
    }

    return subjects;
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return [];
  }
}

export async function getQuizzes(userId: string): Promise<Quiz[]> {
  try {
    const quizzesRef = collection(db, 'quizzes');
    const snapshot = await getDocs(quizzesRef);
    const userProgressRef = collection(db, 'userProgress');
    
    const quizzes: Quiz[] = [];
    
    for (const quizDoc of snapshot.docs) {
      const quizData = quizDoc.data();
      
      // Check if user completed this quiz
      const progressQuery = query(
        userProgressRef, 
        where('userId', '==', userId), 
        where('quizId', '==', quizDoc.id)
      );
      const progressSnap = await getDocs(progressQuery);
      const completed = !progressSnap.empty;
      
      quizzes.push({
        id: quizDoc.id,
        title: quizData.title,
        subjectId: quizData.subjectId,
        difficulty: quizData.difficulty,
        completed,
        position: quizData.position,
      });
    }
    
    return quizzes;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return [];
  }
}

export async function markChapterAsRead(userId: string, subjectId: string, chapterId: string) {
  try {
    const progressRef = doc(db, 'userProgress', `${userId}_${subjectId}`);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      // Update existing progress
      await updateDoc(progressRef, {
        chaptersRead: increment(1),
        [`readChapters.${chapterId}`]: true,
        lastUpdated: Timestamp.now()
      });
    } else {
      // Create new progress entry
      await setDoc(progressRef, {
        userId,
        subjectId,
        chaptersRead: 1,
        readChapters: { [chapterId]: true },
        lastUpdated: Timestamp.now()
      });
    }
    
    // Update user streak
    await updateUserStreak(userId);
  } catch (error) {
    console.error("Error marking chapter as read:", error);
  }
}

export async function completeQuiz(userId: string, quizId: string) {
  try {
    const progressRef = doc(db, 'userProgress', `${userId}_quiz_${quizId}`);
    
    await setDoc(progressRef, {
      userId,
      quizId,
      completed: true,
      completedAt: Timestamp.now()
    });
    
    // Update user streak
    await updateUserStreak(userId);
  } catch (error) {
    console.error("Error completing quiz:", error);
  }
}

export async function getUserStreak(userId: string): Promise<UserStreak> {
  try {
    const streakRef = doc(db, 'userStreaks', userId);
    const streakSnap = await getDoc(streakRef);
    
    if (streakSnap.exists()) {
      const data = streakSnap.data();
      return {
        currentStreak: data.currentStreak || 0,
        lastCompletionDate: data.lastCompletionDate?.toDate().toISOString() || '',
        longestStreak: data.longestStreak || 0
      };
    }
    
    return {
      currentStreak: 0,
      lastCompletionDate: '',
      longestStreak: 0
    };
  } catch (error) {
    console.error("Error getting user streak:", error);
    return {
      currentStreak: 0,
      lastCompletionDate: '',
      longestStreak: 0
    };
  }
}

// TODO : Não é assim que vou lidar com a streak
async function updateUserStreak(userId: string) {
  const streakRef = doc(db, 'userStreaks', userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const streakSnap = await getDoc(streakRef);
  
  if (streakSnap.exists()) {
    const data = streakSnap.data();
    const lastDate = data.lastCompletionDate.toDate();
    lastDate.setHours(0, 0, 0, 0);
    
    const diffInDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Already logged activity today, nothing to update
      return;
    } else if (diffInDays === 1) {
      // Next consecutive day
      const newStreak = data.currentStreak + 1;
      await updateDoc(streakRef, {
        currentStreak: newStreak,
        lastCompletionDate: Timestamp.now(),
        longestStreak: Math.max(newStreak, data.longestStreak || 0)
      });
    } else {
      // Streak broken
      await updateDoc(streakRef, {
        currentStreak: 1,
        lastCompletionDate: Timestamp.now()
      });
    }
  } else {
    // First activity, start streak
    await setDoc(streakRef, {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastCompletionDate: Timestamp.now()
    });
  }
}
