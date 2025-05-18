export interface TranscriptionData {
    transcription: string;
    originalFile: string;
    theme: string;
    fileName: string;
    contentType: string;
    fileSize: number;
    createdAt: any; // Firestore Timestamp or similar
}