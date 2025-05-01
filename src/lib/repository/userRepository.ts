import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";   // our lazy Firestore factory
import type { UserProfile } from "@/types/User";

/* ─── one-shot read ─────────────────────────────────────────── */
export async function fetchProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, "users", uid, "profile"));
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

/* ─── live listener (returns unsubscribe) ───────────────────── */
export function listenProfile(
    uid: string,
    cb: (profile: UserProfile | null) => void,
): () => void {
    return onSnapshot(doc(db, "users", uid, "profile"), (snap) =>
        cb(snap.exists() ? (snap.data() as UserProfile) : null),
    );
}
