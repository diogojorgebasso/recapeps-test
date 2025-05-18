import { db } from "@/lib/firebase/clientApp";
import { getDoc, doc } from "firebase/firestore";

export async function getOral(subjectId: string) {
    return await getDoc(doc(db, "oral-3", subjectId));
}