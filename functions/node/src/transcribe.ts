import { onObjectFinalized } from "firebase-functions/v2/storage";
import { info, warn, error as logError } from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { v2 as speech } from '@google-cloud/speech';
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const transcribeuploaddocument = onObjectFinalized({
    ingressSettings: "ALLOW_INTERNAL_ONLY",
    serviceAccount: "transcribe-upload-document-run@recapeps-test.iam.gserviceaccount.com"
}, async (event) => {
    const filePath = event.data.name; // Example: user/someUserId/transcripts/someTheme/myAudio.webm
    // Updated regex to capture userId, theme, and fileName from the path
    const pathMatch = filePath.match(/^user\/(.*?)\/transcripts\/(.*?)\/(.*?)$/);

    const speechClient = new speech.SpeechClient();

    if (!pathMatch) {
        info(`File ${filePath} does not match the target path pattern. Skipping.`);
        return;
    }

    const userId = pathMatch[1];
    const theme = pathMatch[2]; // Extracted theme
    const fileName = pathMatch[3]; // Extracted original file name (e.g., myAudio.webm)

    info(`File path: ${filePath}`);
    // Log the extracted theme and fileName
    info(`User ID: ${userId}, Theme: ${theme}, File Name: ${fileName}`);

    const bucketName = event.data.bucket;
    const gcsUri = `gs://${bucketName}/${filePath}`;

    // Use theme and fileName for logging purposes
    info(`Processing transcription for user ${userId}, theme ${theme}, file ${fileName}`);

    try {
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(filePath);
        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType || "";

        let transcriptionText = "";

        if (contentType.startsWith('audio/') || contentType.startsWith('video/')) {
            const request = {
                recognizer: `projects/recapeps-test/locations/global/recognizers/_`,
                config: {
                    languageCodes: ["fr-FR"],
                    model: "latest_long",
                    profanityFilter: true,
                    enableAutomaticPunctuation: true, // Enable punctuation
                    enableWordConfidence: true,       // Get confidence scores
                    enableSpokenPunctuation: true,    // Detect spoken punctuation
                    maxAlternatives: 1,
                    useEnhanced: true,                // Use enhanced model for better formatting
                    autoDecodingConfig: {}
                },
                uri: gcsUri,
            };

            info(`Sending recognition request for ${gcsUri}`);
            const [response] = await speechClient.recognize(request);

            info(response);

            if (response.results && response.results.length > 0) {
                // Improve formatting by preserving paragraph-like structures
                transcriptionText = response.results
                    .map(result => {
                        const transcript = result.alternatives && result.alternatives[0]?.transcript || "";
                        // If the transcript ends with a sentence-ending punctuation, add a line break
                        return transcript.trim();
                    })
                    .join(" ")
                    .replace(/\.\s+/g, ".\n\n") // Add paragraph breaks after periods
                    .replace(/\?\s+/g, "?\n\n") // Add paragraph breaks after question marks
                    .replace(/!\s+/g, "!\n\n")  // Add paragraph breaks after exclamation marks
                    .trim();
            }
            info("Audio transcription completed successfully");
        } else {
            warn(`Unsupported file type for transcription: ${contentType}`);
            transcriptionText = "Unsupported file type";
        }

        // Save to Firestore
        // The document ID in Firestore will be a combination of theme and fileName
        // to ensure uniqueness and retrievability.
        const firestoreDocId = `${theme}-${fileName}`;
        const docRef = db.collection("users").doc(userId).collection("transcripts").doc(firestoreDocId);
        await docRef.set({
            transcription: transcriptionText,
            originalFile: filePath, // Store the full GCS path
            theme: theme, // Store theme separately
            fileName: fileName, // Store original file name separately
            contentType: contentType,
            fileSize: metadata.size,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update log message
        info(`Transcription saved successfully for user ${userId}, document ${firestoreDocId}`);
    } catch (err) {
        const e = err as Error;
        logError(`Error transcribing document ${filePath}:`, e);
    }
});
