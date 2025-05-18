import { ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/clientApp";

export async function uploadRecordingAction(formData: FormData, userId: string, theme: string) {
    const file = formData.get('audioBlob') as File | null;

    if (!file) {
        return { success: false, error: "No audio file received." };
    }
    const originalFileName = file.name; // Capture the original file name

    try {
        const blob = new Blob([file], { type: file.type || 'audio/webm' }); // Use file.type if available
        // Construct the full path in Firebase Storage, incorporating the theme as a directory
        // and using the original file name.
        const storagePath = `user/${userId}/transcripts/${theme}/${originalFileName}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, blob);

        const redirectionFilePath = `/parcours/oral-3/corrections/${theme}`;
        // This ID will be used to fetch the specific transcription later.
        const transcriptionId = `${theme}-${originalFileName}`;

        return { success: true, filePath: redirectionFilePath, transcriptionId: transcriptionId };
    } catch (error: any) {
        console.error("Error uploading recording in server action:", error);
        return { success: false, error: error.message || "Failed to upload recording." };
    }
}