// lib/repos/quizRepo.ts
import {
    collection, query, orderBy, limit, getDocs, onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase/clientApp";

export type QuizRow = {
    id: string;
    score: number;
    subjectId: string;
    date: Date;
};

export async function fetchLastQuizzes(uid: string, n = 10): Promise<QuizRow[]> {
    const ref = collection(db, "users", uid, "quizzes");
    const q = query(ref, orderBy("date", "desc"), limit(n));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
        id: d.id,
        score: d.data().score,
        subjectId: d.data().subjectId,
        date: d.data().date.toDate?.() ?? new Date(d.data().date),
    })).reverse();
}

export function listenLastQuizzes(
    uid: string,
    cb: (rows: QuizRow[]) => void,
    n = 10,
) {
    const ref = collection(db, "users", uid, "quizzes");
    const q = query(ref, orderBy("date", "desc"), limit(n));
    return onSnapshot(q, (snap) => {
        const rows = snap.docs.map(/* …same map… */).reverse();
        cb(rows);
    });
}
