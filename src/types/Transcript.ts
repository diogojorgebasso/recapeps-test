export interface TranscriptionData {
    transcription?: string; // Optional: could hold short error messages or be populated client-side after fetching from path
    transcriptionPath?: string; // Path to the transcription text file in GCS (e.g., gs://bucket/path/to/file.txt)
    originalFile: string;
    theme: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    createdAt: any; // Firestore Timestamp or similar
    status?: TranscriptionStatus; // Add status here
    errorMessage?: string; // Add error message here
    updatedAt?: any;
}

export type TranscriptionStatus = "idle" | "uploading" | "processing" | "completed" | "error" | "error_unsupported_type";