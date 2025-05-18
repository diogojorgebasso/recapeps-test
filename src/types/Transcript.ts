export interface TranscriptionData {
    transcription?: string; // Optional: could hold short error messages or be populated client-side after fetching from path
    transcriptionJsonPath?: string; // Path to the transcription JSON output file in GCS (e.g., user/uid/transcripts/processed/file.json)
    originalFile: string;
    theme: string;
    fileName: string;
    fileSize?: number; // Size of the original uploaded file in bytes
    contentType?: string; // Content type of the original uploaded file
    createdAt: any; // Firestore Timestamp or similar
    status: TranscriptionStatus; // Add status here
    errorMessage?: string; // Add error message here
}

export type TranscriptionStatus = "idle" | "uploading" | "processing" | "completed" | "error" | "error_unsupported_type"; // Added error_unsupported_type from page.tsx