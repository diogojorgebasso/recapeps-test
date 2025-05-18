'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Heading,
    Text,
    Dialog,
    Container,
    CloseButton,
    Spinner,
} from "@chakra-ui/react";
import { uploadRecordingAction } from "./uploadRecordingAction";
import { getOral } from "./getOral";
import { useUserWithClaims } from "@/lib/getUser";
import { toaster, Toaster } from "@/components/ui/toaster";

export default function ClientComponent({ theme }: { theme: string }) {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const { user } = useUserWithClaims();

    useEffect(() => {
        if (user === undefined) {
            return;
        }
        if (user === null) {
            router.push("/login"); // Ensure this path is correct for your app
            return;
        }
        if (theme) {
            getOral(theme)
                .then((oralDoc) => {
                    if (oralDoc.exists()) {
                        const data = oralDoc.data();
                        setTitle(data.title);
                    } else {
                        console.error(`Oral document with subjectId "${theme}" does not exist.`);
                    }
                })
                .catch((error) => {
                    console.error(`Error fetching oral document for subjectId "${theme}":`, error);
                });
        }
    }, [user, router, theme]);

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const visualizeAudio = useCallback(() => {
        // ... (visualizeAudio implementation - ensure it's defined or keep existing)
        if (!canvasRef.current || !analyserRef.current || !audioContextRef.current) return;
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const width = canvas.width;
        const height = canvas.height;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        canvasCtx.clearRect(0, 0, width, height);

        const draw = () => {
            if (!analyserRef.current) { // Check if analyser is still valid
                if (animationRef.current) cancelAnimationFrame(animationRef.current);
                return;
            }
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(245, 245, 245)'; // Or your theme background
            canvasCtx.fillRect(0, 0, width, height);
            canvasCtx.lineWidth = 2;
            // Stroke color based on actual recording state, not just isRecording
            const currentRecorderState = mediaRecorderRef.current?.state;
            canvasCtx.strokeStyle = currentRecorderState === 'recording' ? 'rgb(255, 0, 0)' : 'rgb(0, 123, 255)';
            canvasCtx.beginPath();

            const sliceWidth = width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * height / 2;
                if (i === 0) canvasCtx.moveTo(x, y);
                else canvasCtx.lineTo(x, y);
                x += sliceWidth;
            }
            canvasCtx.lineTo(width, height / 2);
            canvasCtx.stroke();
        };
        draw();
    }, []);


    const performUpload = async (audioBlob: Blob) => {
        if (!user?.uid) {
            toaster.create({ title: "Erreur", description: "Utilisateur non identifié.", type: "error" });
            setIsUploading(false);
            return;
        }

        setIsUploading(true);
        const uploadToastId = toaster.create({ title: "Upload en cours...", description: "Votre enregistrement est en cours d'envoi.", type: "info", duration: 0 });

        try {
            const formData = new FormData();
            formData.append('audioBlob', audioBlob, `oral_${theme}.webm`);
            const result = await uploadRecordingAction(formData, user.uid, theme);

            if (uploadToastId) toaster.dismiss(uploadToastId);

            if (result.success && result.filePath && result.transcriptionId) {
                toaster.create({ title: "Upload réussi!", description: "Redirection vers la page de correction.", type: "success" });
                // Navigate immediately. The correction page will handle loading/processing states.
                router.push(`${result.filePath}?transcriptionId=${result.transcriptionId}`);
            } else {
                toaster.create({ title: "Erreur d'upload", description: result.error || "Une erreur est survenue.", type: "error" });
            }
        } catch (error: any) {
            if (uploadToastId) toaster.dismiss(uploadToastId);
            toaster.create({ title: "Erreur critique d'upload", description: error.message || "Une erreur inattendue est survenue.", type: "error" });
        } finally {
            setIsUploading(false); // Set to false after upload attempt
        }
    };

    // Removed listenForTranscription function

    const setupMediaRecorder = (stream: MediaStream) => {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            setIsRecording(false);
            setIsPaused(false);
            // isUploading will be set by performUpload
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            // Close audio context and disconnect source
            if (analyserRef.current) analyserRef.current.disconnect();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                // Check if source nodes exist and disconnect them
                // This part is tricky as source nodes are not directly held on ref
                // The stream tracks are stopped which should help.
                audioContextRef.current.close().catch(console.error);
                audioContextRef.current = null;
                analyserRef.current = null;
            }


            if (audioChunksRef.current.length > 0) {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                performUpload(audioBlob);
            }
            // Stream tracks are stopped by the caller of mediaRecorder.stop() if it's a final stop.
        };

        recorder.onpause = () => {
            setIsRecording(false); // Timer will use this
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };

        recorder.onresume = () => {
            setIsRecording(true); // Timer will use this
            visualizeAudio();
        };

        // Setup audio visualization
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error); // Close previous context if any
        }
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
    };

    const startNewRecording = async () => {
        if (isUploading) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setupMediaRecorder(stream);
            mediaRecorderRef.current!.start();
            setIsRecording(true);
            setIsPaused(false);
            setTimeLeft(180);
            visualizeAudio();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            toaster.create({ title: "Erreur Microphone", description: "Vérifiez les permissions du microphone.", type: "error" });
        }
    };

    const handlePauseRecording = async () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.pause();
            setIsPaused(true); // isRecording will be set to false by onpause handler
            setOpen(true);
        }
    };

    const handleResumeRecording = async () => {
        if (mediaRecorderRef.current?.state === "paused") {
            mediaRecorderRef.current.resume();
            setIsPaused(false); // isRecording will be set to true by onresume handler
            setOpen(false);
        }
    };

    const handleStopAndFinalizeRecording = () => {
        if (mediaRecorderRef.current && (mediaRecorderRef.current.state === "recording" || mediaRecorderRef.current.state === "paused")) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); // Stop stream tracks
            mediaRecorderRef.current.stop(); // Triggers onstop, then performUpload
        }
        setOpen(false);
    };

    useEffect(() => {
        if (isRecording && !isPaused && timeLeft > 0) {
            timerRef.current = setTimeout(() => setTimeLeft(prevTime => prevTime - 1), 1000);
        } else if (isRecording && !isPaused && timeLeft === 0) {
            toaster.create({ title: "Temps écoulé!", description: "Enregistrement terminé, préparation de l'envoi...", type: "info" });
            handleStopAndFinalizeRecording(); // Stop, which will trigger upload via onstop
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isRecording, isPaused, timeLeft]);

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (mediaRecorderRef.current?.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
        };
    }, []);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    let mainButtonText = "Démarrer l'enregistrement";
    let mainButtonAction = startNewRecording;
    let mainButtonColorScheme = "teal";

    if (isRecording && !isPaused) {
        mainButtonText = "Mettre en pause";
        mainButtonAction = handlePauseRecording;
        mainButtonColorScheme = "orange";
    } else if (isPaused) {
        mainButtonText = "Reprendre";
        mainButtonAction = handleResumeRecording;
        mainButtonColorScheme = "green";
    }


    return (
        <Container maxW="container.md" py={8}>
            <Toaster />
            <Heading size="xl" textAlign="center">{theme}</Heading>
            <Text fontSize="lg" mt={2}>{title}</Text>
            <Text fontSize="lg" mt={2}>Comment analysez-vous cette situation et quelles solutions envisagez-vous ?</Text>

            <Box width="100%" height="120px" bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200" overflow="hidden" my={4}>
                <canvas ref={canvasRef} width="800" height="120" style={{ width: '100%', height: '100%' }} />
            </Box>

            <Text fontSize="4xl" fontWeight="bold" fontFamily="mono" color={timeLeft <= 30 && !isPaused ? "red.500" : ""}>
                {formatTime(timeLeft)}
            </Text>

            <Button
                size="lg"
                height="70px"
                width="220px"
                colorScheme={mainButtonColorScheme}
                onClick={mainButtonAction}
                boxShadow="md"
                _hover={{ transform: 'scale(1.05)' }}
                transition="all 0.2s"
                borderRadius="full"
                disabled={isUploading || (mainButtonAction === startNewRecording && user === undefined)}
            >
                {isUploading ? <Spinner /> : mainButtonText}
            </Button>

            <Dialog.Root open={open} onOpenChange={(e) => { if (!isUploading) setOpen(e.open); }}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>
                                {isPaused ? "Enregistrement en pause" : "Enregistrement terminé"}
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Text>
                                {isPaused ? "Que souhaitez-vous faire ?" : "Le temps est écoulé ou vous avez arrêté l'enregistrement."}
                            </Text>
                        </Dialog.Body>
                        <Dialog.Footer>
                            {isPaused && timeLeft > 0 && (
                                <Button variant="ghost" onClick={handleResumeRecording} disabled={isUploading}>
                                    Continuer à réfléchir
                                </Button>
                            )}
                            <Button
                                colorScheme="blue"
                                mr={3}
                                onClick={handleStopAndFinalizeRecording}
                                loading={isUploading && mediaRecorderRef.current?.state !== 'paused'}
                                disabled={isUploading}
                            >
                                {isPaused ? "Terminer et voir la correction" : "Voir la correction"}
                            </Button>
                        </Dialog.Footer>
                        {!isUploading && (
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                        )}
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </Container>
    );
}