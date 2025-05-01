// lib/firebase/userRepository.ts
import {
    doc,
    onSnapshot,
    getDoc,
    getFirestore,
    Firestore,
} from "firebase/firestore";
import type { UserProfile } from "@/types";

class UserRepository {
    private db: Firestore;

    constructor() {
        this.db = getFirestore();         // client SDK (runs in browser)
    }

    /** One-shot read */
    async fetchProfile(uid: string): Promise<UserProfile | null> {
        const snap = await getDoc(doc(this.db, "users", uid, "profile"));
        return snap.exists() ? (snap.data() as UserProfile) : null;
    }

    /**
     * Real-time listener.
     * Returns an unsubscribe function.
     */
    listenProfile(
        uid: string,
        cb: (profile: UserProfile | null) => void,
    ): () => void {
        return onSnapshot(
            doc(this.db, "users", uid, "profile"),
            (snap) => cb(snap.exists() ? (snap.data() as UserProfile) : null),
        );
    }
}

export const userRepo = new UserRepository();
