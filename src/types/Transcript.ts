interface TranscriptionData {
    transcription: string;
    originalFile: string;
    contentType: string;
    fileSize: number;
    createdAt: {
        toDate: () => Date;
    };
}
