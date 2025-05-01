import { Timestamp } from "firebase/firestore";

export interface QuizResult {
    subjectId: string;
    timestamp: Timestamp;
    score: number;
}

export interface UserQuiz {
    timestamp: Timestamp;
    score: number;
    subjectId: string;
    totalQuestions: number;
    questions: Array<{
        questionId: string;
        selectedAnswers: string[];
        timeToAnswer: number;
        explanation: string;
    }>;
    quizId: string;
}