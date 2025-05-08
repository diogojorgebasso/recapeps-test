"use server"
import { db } from "@/lib/firebase/clientApp"
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp"
import { collection, where, query, limit, getDocs } from "firebase/firestore"

export async function getIsNotification() {
    const { user } = await getAuthenticatedAppForUser()
    if (!user) {
        throw new Error("User not authenticated")
    }
    const docRef = collection(db, "user", user.uid, "notification")
    const q = query(docRef, where("isRead", "==", false), limit(1))
    const snapshot = await getDocs(q)
    return snapshot.docs.length > 0
}
