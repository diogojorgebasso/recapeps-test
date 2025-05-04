import { Timestamp, DocumentReference } from "firebase/firestore";

// Le quiz soit dans la collection ecrit-1 soit dans la collection ecrit-2
export interface Quiz {
    id: string;
    title: string; // Subject name or quiz title
    level: number;
    quizRef: DocumentReference;
    premium: boolean;
    questions: Array<Question>;
}

export interface AttemptQuiz {
    id: string;
    createdAt: Timestamp;
    quizRef: DocumentReference;
    questions: Array<Question>;
    state: 'doing' | 'completed'
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
    }>;
    explanation?: string;
}
