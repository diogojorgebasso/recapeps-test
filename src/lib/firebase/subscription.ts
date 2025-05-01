import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
    getFirestore,
    limit,
} from "firebase/firestore";

export function listenActiveSubscription(
    uid: string,
    cb: (sub: any | null) => void
) {
    const db = getFirestore();
    const q = query(
        collection(db, "users", uid, "subscriptions"),
        where("status", "==", "active"),
        limit(1)
    );
    return onSnapshot(q, (snap) => cb(snap.docs[0]?.data() ?? null));
}

export async function fetchActiveSubscription(uid: string) {
    const db = getFirestore();
    const q = query(
        collection(db, "users", uid, "subscriptions"),
        where("status", "==", "active"),
        limit(1)
    );
    const snap = await getDocs(q);
    return snap.docs[0]?.data() ?? null;
}
