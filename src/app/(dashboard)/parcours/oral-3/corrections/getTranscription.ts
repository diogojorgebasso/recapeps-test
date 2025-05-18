import { db } from "@/lib/firebase/clientApp";
import { doc, getDoc } from "firebase/firestore";

// Assuming TranscriptionData interface is defined, e.g.:
// interface TranscriptionData {
//   transcription: string;
//   originalFile: string;
//   theme: string;
//   fileName: string;
//   contentType: string;
//   fileSize: number;
//   createdAt: any; // Firestore Timestamp
// }

// The function now takes a single `transcriptionId` which is `${theme}-${originalFileName}`.
export default async function getTranscription(uid: string, transcriptionId: string) {

    const transcriptDoc = doc(
        db,
        // The path now uses the combined transcriptionId
        `users/${uid}/transcripts/${transcriptionId}`
    );

    const snapshot = await getDoc(transcriptDoc);
    if (snapshot.exists()) {
        return snapshot.data(); // as TranscriptionData; - Type assertion can be done by the caller
    } else {
        console.log(`No such document for transcriptionId: ${transcriptionId}`);
        return null; // Or throw an error, depending on desired error handling
    }
}