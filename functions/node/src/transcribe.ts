import { onObjectFinalized } from "firebase-functions/v2/storage";
import { info, } from "firebase-functions/logger";
import { FieldValue, getFirestore } from "firebase-admin/firestore"; // Changed import
import speech from '@google-cloud/speech';

const db = getFirestore();

export const transcribeuploaddocument = onObjectFinalized(async (event) => {
    const filePath = event.data.name; // Example: user/someUserId/transcripts/someTheme.webm
    const pathMatch = filePath.match(/^user\/(.*?)\/transcripts\/(.*?)$/);

    if (!pathMatch) {
        info(`File ${filePath} does not match the target path pattern. Skipping.`);
        return;
    }

    const speechClient = new speech.SpeechClient();
    const userId = pathMatch[1];
    const fileNameWithExtension = pathMatch[2]; // e.g., someTheme.webm
    const theme = fileNameWithExtension.replace(/\.(webm|mp3|wav|ogg|aac|flac|m4a)$/i, '');
    const bucketName = event.data.bucket;
    const fileSize = event.data.size; // Get file size
    const contentType = event.data.contentType; // Get content type

    const gcsUri = `gs://${bucketName}/${filePath}`;

    const outputTranscriptionJsonFileName = `${theme}_transcription_output.json`;
    const outputTranscriptionJsonPath = `user/${userId}/transcripts/processed/${outputTranscriptionJsonFileName}`;
    const outputGcsUri = `gs://${bucketName}/${outputTranscriptionJsonPath}`;

    const docRef = db.collection("users").doc(userId).collection("transcripts").doc(theme);
    await docRef.set({
        originalFile: filePath,
        theme: theme,
        fileName: fileNameWithExtension,
        fileSize: fileSize, // Add fileSize
        contentType: contentType, // Add contentType
        status: "processing",
        createdAt: FieldValue.serverTimestamp(), // Changed usage
    }, { merge: true });

    try {
        info(`Processing transcription for user ${userId}, theme ${theme}, file ${fileNameWithExtension}. Status set to processing.`);

        const config = {
            languageCode: "fr-FR",
            profanityFilter: true,
            enableAutomaticPunctuation: true,
            enableWordConfidence: true, // Using IBoolValue format
            enableSpokenPunctuation: { value: true }, // Using IBoolValue format
            maxAlternatives: 1,
            useEnhanced: true,
            autoDecodingConfig: {}
        };

        const audio = {
            uri: gcsUri,
        };

        const request = {
            recognizer: `projects/recapeps-test/locations/global/recognizers/_`,
            config: config,
            audio: audio,
            outputConfig: {
                gcsUri: outputGcsUri,
            },
        };

        info(`Sending long running recognition request for ${gcsUri}. Output will be at ${outputGcsUri}`);
        const [operation] = await speechClient.longRunningRecognize(request);
        await operation.promise();

        const firestoreUpdateData: any = {
            status: "completed",
            updatedAt: FieldValue.serverTimestamp(), // Changed usage
            transcriptionJsonPath: outputTranscriptionJsonPath, // Ensure this field name matches type
        };
        await docRef.set(firestoreUpdateData, { merge: true });
        info(`Transcription completed successfully for user ${userId}, theme ${theme}. Firestore updated.`);

    }
    catch (error: any) {
        info(`Error during transcription for user ${userId}, theme ${theme}:`, error);
        const errorUpdateData = {
            status: "error",
            errorMessage: error.message || "Unknown error",
            updatedAt: FieldValue.serverTimestamp(), // Changed usage
        };
        await docRef.set(errorUpdateData, { merge: true });
        throw error;
    }
});
