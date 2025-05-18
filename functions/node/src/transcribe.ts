import { onObjectFinalized } from "firebase-functions/v2/storage";
import { info, } from "firebase-functions/logger";
import { FieldValue, getFirestore } from "firebase-admin/firestore"; // Changed import
import speech, { protos } from '@google-cloud/speech';
import { google } from "@google-cloud/speech/build/protos/protos";

const db = getFirestore();

export const transcribeuploaddocument = onObjectFinalized(async (event) => {
    const filePath = event.data.name; // Example: user/someUserId/transcripts/someTheme.webm
    const pathMatch = filePath.match(/^user\/(.*?)\/transcripts\/([^/]+)$/);

    if (!pathMatch) {
        info(`File ${filePath} does not match the target path pattern (user/{uid}/transcripts/{filename}). Skipping.`);
        return;
    }

    const userId = pathMatch[1];
    const fileNameWithExtension = pathMatch[2]; // e.g., someTheme.webm

    // Check if the file has a supported audio extension
    const audioExtensions = /\.(webm|mp3|wav|ogg|aac|flac|m4a)$/i;
    if (!audioExtensions.test(fileNameWithExtension)) {
        info(`File ${filePath} is not a supported audio file type. Skipping.`);
        return;
    }

    const speechClient = new speech.SpeechClient();
    const theme = fileNameWithExtension.replace(audioExtensions, ''); // Use the regex for stripping extension
    const bucketName = event.data.bucket;
    const fileSize = event.data.size;
    const contentType = event.data.contentType;

    const gcsUri = `gs://${bucketName}/${filePath}`;

    const outputJsonFileName = `${theme}_${Date.now()}_transcription_output.json`;
    const intendedOutputJsonRelativePath = `user/${userId}/transcripts/processed/${outputJsonFileName}`;
    const intendedOutputGcsUri = `gs://${bucketName}/${intendedOutputJsonRelativePath}`;

    const docRef = db.collection("users").doc(userId).collection("transcripts").doc(theme);
    await docRef.set({
        originalFile: filePath,
        theme: theme,
        fileName: fileNameWithExtension,
        fileSize: fileSize,
        contentType: contentType,
        status: "processing",
        createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    try {
        info(`Processing transcription for user ${userId}, theme ${theme}, file ${fileNameWithExtension}. Status set to processing.`);

        const config: google.cloud.speech.v1.IRecognitionConfig = {
            encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS, // Use LINEAR16 for FLAC and WebM
            sampleRateHertz: 48000, // Adjust this based on your audio file 
            languageCode: "fr-FR",
            profanityFilter: true,
            enableAutomaticPunctuation: true,
            enableWordConfidence: true,
            maxAlternatives: 1,
            useEnhanced: true,
        };

        const audio = {
            uri: gcsUri,
        };

        const longRunningRequest: protos.google.cloud.speech.v1.ILongRunningRecognizeRequest = {
            config: config,
            audio: audio,
            outputConfig: {
                gcsUri: intendedOutputGcsUri,
            },
        };

        info(`Sending long running recognition request for ${gcsUri}. Output will be at ${intendedOutputGcsUri}`);
        const [operation] = await speechClient.longRunningRecognize(longRunningRequest);
        await operation.promise();

        const firestoreUpdateData = {
            status: "completed",
            updatedAt: FieldValue.serverTimestamp(),
            transcriptionJsonPath: intendedOutputJsonRelativePath, // Store the relative path
        };
        await docRef.set(firestoreUpdateData, { merge: true });
        info(`Transcription completed successfully. Output JSON at: gs://${bucketName}/${intendedOutputJsonRelativePath}`);
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
