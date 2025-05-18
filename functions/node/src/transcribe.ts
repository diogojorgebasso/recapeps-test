import { onObjectFinalized } from "firebase-functions/v2/storage";
import { info, warn, error as logError } from "firebase-functions/logger";
import * as admin from "firebase-admin";
import speech from '@google-cloud/speech';
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage"; // Import Storage

const db = getFirestore();
const storageAdmin = getStorage(); // Initialize Admin Storage

export const transcribeuploaddocument = onObjectFinalized({
}, async (event) => {
    const filePath = event.data.name; // Example: user/someUserId/transcripts/someTheme.webm
    const pathMatch = filePath.match(/^user\/(.*?)\/transcripts\/(.*?)$/);

    const speechClient = new speech.SpeechClient();

    if (!pathMatch) {
        info(`File ${filePath} does not match the target path pattern. Skipping.`);
        return;
    }

    const userId = pathMatch[1];
    const fileNameWithExtension = pathMatch[2]; // e.g., someTheme.webm
    const theme = fileNameWithExtension.replace(/\.(webm|mp3|wav|ogg|aac|flac|m4a)$/i, '');

    info(`File path: ${filePath}`);
    info(`User ID: ${userId}, Theme: ${theme}, File Name: ${fileNameWithExtension}`);

    const bucketName = event.data.bucket;
    const gcsUri = `gs://${bucketName}/${filePath}`;

    const firestoreDocId = theme;
    const docRef = db.collection("users").doc(userId).collection("transcripts").doc(firestoreDocId);

    // Define path for the output transcription text file
    const transcriptionTextFileName = `${theme}_transcription.txt`;
    const transcriptionTextPath = `user/${userId}/transcripts/processed/${transcriptionTextFileName}`; // Store text files in a 'processed' subfolder

    try {
        await docRef.set({
            originalFile: filePath, // Path to the original audio file
            theme: theme,
            fileName: fileNameWithExtension, // Original audio file name
            status: "processing",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        info(`Processing transcription for user ${userId}, theme ${theme}, file ${fileNameWithExtension}. Status set to processing.`);

        const bucket = storageAdmin.bucket(bucketName)
        const file = bucket.file(filePath);
        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType || "";

        let transcriptionText = "";
        let finalStatus = "completed";
        let savedTranscriptionPath: string | null = null;

        if (contentType.startsWith('audio/') || contentType.startsWith('video/')) {
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
            };

            info(`Sending long running recognition request for ${gcsUri}`);
            // Use longRunningRecognize for audio longer than 60 seconds
            const [operation] = await speechClient.longRunningRecognize(request);

            info('Waiting for long running operation to complete...');
            const [response] = await operation.promise();
            info('Long running operation completed.');

            // info(response); // Be careful logging entire large responses

            if (response.results && response.results.length > 0) {
                transcriptionText = response.results
                    .map(result => {
                        const transcript = result.alternatives && result.alternatives[0]?.transcript || "";
                        return transcript.trim();
                    })
                    .join(" ") // Join all parts of the transcript
                    .replace(/\.\s+/g, ".\n\n")
                    .replace(/\?\s+/g, "?\n\n")
                    .replace(/!\s+/g, "!\n\n")
                    .trim();

                // Save transcriptionText to a new file in GCS
                const textFile = bucket.file(transcriptionTextPath);
                await textFile.save(transcriptionText, {
                    contentType: 'text/plain',
                    metadata: {
                        // You can add custom metadata if needed
                        originalAudioFile: filePath
                    }
                });
                savedTranscriptionPath = `gs://${bucketName}/${transcriptionTextPath}`; // Full GCS URI for the text file
                info(`Transcription text saved to: ${savedTranscriptionPath}`);
            } else {
                info("No transcription results from Speech API.");
                transcriptionText = ""; // Ensure it's an empty string if no results
            }
            info("Audio transcription processing completed.");
        } else {
            warn(`Unsupported file type for transcription: ${contentType}`);
            transcriptionText = "Unsupported file type"; // This won't be saved to GCS, only status updated
            finalStatus = "error_unsupported_type";
        }

        // Update Firestore with final status and path to transcription text file
        const firestoreUpdateData: any = {
            contentType: contentType, // Original audio content type
            fileSize: metadata.size,  // Original audio file size
            status: finalStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (finalStatus === "completed" && savedTranscriptionPath) {
            firestoreUpdateData.transcriptionPath = savedTranscriptionPath;
        } else if (finalStatus === "completed" && !savedTranscriptionPath) {
            firestoreUpdateData.transcriptionPath = null;
            firestoreUpdateData.transcription = ""; // Store empty string if no path
        }

        if (finalStatus !== "completed") {
            // If there was an error or unsupported type, we might not have transcription text
            // but we still want to record the attempt.
            // The 'transcription' field could store a brief note or be omitted.
            firestoreUpdateData.transcription = transcriptionText;
        }


        await docRef.set(firestoreUpdateData, { merge: true });

        info(`Transcription record updated successfully for user ${userId}, document ${firestoreDocId}. Status: ${finalStatus}`);
    } catch (err) {
        const e = err as Error;
        logError(`Error transcribing document ${filePath}:`, e);
        try {
            await docRef.set({
                status: "error",
                errorMessage: e.message,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            info(`Error status saved for user ${userId}, document ${firestoreDocId}`);
        } catch (dbError) {
            logError(`Failed to update error status in Firestore for ${filePath}:`, dbError);
        }
    }
});
