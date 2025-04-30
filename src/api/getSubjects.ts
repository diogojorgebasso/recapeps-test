import { collection, getDocs } from "firebase/firestore";
import { db } from "@/utils/firebase";
import { SubjectNote } from "@/types/Subject";

/**
 * Get notes for a specific collection or both ecrit types
 * @param collectionName Optional collection name ('ecrit-1' or 'ecrit-2')
 * @returns List of notes based on the collection name or all notes if no collection specified
 */
export async function getNotes(collectionName?: string): Promise<SubjectNote[]> {
    try {
        let subjects: SubjectNote[] = [];

        if (collectionName) {
            // If a specific collection is requested (ecrit-1 or ecrit-2)
            const querySnapshot = await getDocs(collection(db, collectionName));
            subjects = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as SubjectNote[];
        } else {
            // For backward compatibility, fetch from both collections and combine
            const ecrit1Snapshot = await getDocs(collection(db, 'ecrit-1'));
            const ecrit1Subjects = ecrit1Snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as SubjectNote[];

            const ecrit2Snapshot = await getDocs(collection(db, 'ecrit-2'));
            const ecrit2Subjects = ecrit2Snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as SubjectNote[];

            subjects = [...ecrit1Subjects, ...ecrit2Subjects];
        }

        return subjects;
    } catch (error) {
        console.error("Error fetching notes:", error);
        return [];
    }
}

/**
 * Get subjects for other functionalities
 */
export async function getSubjects(userId?: string) {
    try {
        const querySnapshot = await getDocs(collection(db, 'subjects'));
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return [];
    }
}