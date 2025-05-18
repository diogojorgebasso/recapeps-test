import { ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/clientApp";

export async function uploadRecordingAction(formData: FormData, userId: string, theme: string) {
    const file = formData.get('audioBlob') as File | null;

    if (!file) {
        return { success: false, error: "No audio file received." };
    }

    try {
        const blob = new Blob([file], { type: file.type || 'audio/webm' });
        // Storage path will be user/{userId}/transcripts/{theme}.webm
        // Assuming one recording per theme, identified by the theme name with a .webm extension.
        const storageFileName = `${theme}.webm`;
        const storagePath = `user/${userId}/transcripts/${storageFileName}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, blob);

        const redirectionFilePath = `/parcours/oral-3/corrections/${theme}`;
        // The transcriptionId is now simply the theme.
        const transcriptionId = theme;

        return { success: true, filePath: redirectionFilePath, transcriptionId: transcriptionId };
    } catch (error: any) {
        console.error("Error uploading recording in server action:", error);
        return { success: false, error: error.message || "Failed to upload recording." };
    }
}