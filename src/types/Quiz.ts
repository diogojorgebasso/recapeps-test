import { Timestamp, DocumentReference } from "firebase/firestore";

export type QuizState = 'completed' | 'retry' | 'doing' | 'unlocked' | 'locked';

export interface QuizTrail {
    id: string;
    name: string; // Name of the Quiz
    level: number;
    state: QuizState;
};

export interface Quiz {
    id: string;
    name: string;
    level: number;
    premium: boolean;
    questions: Array<Question>;
}

export interface AttemptQuiz {
    id: string;
    createdAt: Timestamp;
    quizRef: DocumentReference;
    questions: Array<Question>;
    state: QuizState;
    score: number;
    premium: boolean;
}

export interface Question {
    id: string;
    question: string;
    answers: Array<{
        id: string;
        answer: string;
        isCorrect: boolean;
        timeSpent?: number;
    }>;
    explanation?: string;
}

// Omit the Fields that I already have in the Database.
export interface QuizResult extends Omit<AttemptQuiz, 'createdAt' | 'state' | 'premium' | 'id' | 'quizRef'> {
    completedAt: Timestamp;
}
