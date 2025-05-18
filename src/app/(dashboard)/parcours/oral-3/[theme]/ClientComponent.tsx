'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import {
    Box,
    Button,
    Center,
    Heading,
    Text,
    Dialog,
    Container,
    CloseButton,
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
            return; // Wait for user state to be determined
        }

        // If user is null, it means the user is not logged in after loading.
        if (user === null) {
            router.push("/login");
            return;
        }

        // If user is an object, the user is logged in. Proceed to fetch data.
        // Ensure subjectId is valid before fetching
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
    }, [user, router, theme]); // Added router to dependency array

    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // Add uploading state
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refs for audio visualization
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            // Clear canvas
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }

            // Show upload dialog when manually stopping recording
            setTimeout(() => {
                if (audioChunksRef.current.length > 0) {
                    setOpen(true);
                }
            }, 200);
        }
    }, [isRecording]);

    const startRecording = async () => {
        audioChunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);

            // Setup audio visualization
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            // Start visualizing
            visualizeAudio();

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setTimeLeft(180); // Reset timer to 3 minutes
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    };

    // Timer countdown effect
    useEffect(() => {
        if (isRecording && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (isRecording && timeLeft === 0) {
            stopRecording();
            setOpen(true);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [timeLeft, isRecording, stopRecording]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);


    const visualizeAudio = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const width = canvas.width;
        const height = canvas.height;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        canvasCtx.clearRect(0, 0, width, height);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            if (!analyserRef.current) return;
            analyserRef.current.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(245, 245, 245)';
            canvasCtx.fillRect(0, 0, width, height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = isRecording ? 'rgb(255, 0, 0)' : 'rgb(0, 123, 255)';
            canvasCtx.beginPath();

            const sliceWidth = width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * height / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(width, height / 2);
            canvasCtx.stroke();
        };

        draw();
    };

    const uploadRecording = async () => {
        if (audioChunksRef.current.length === 0 || !user?.uid) {
            toaster.create({
                title: "Erreur",
                description: "Aucun enregistrement à envoyer ou utilisateur non identifié.",
                type: "error",
            });
            return;
        }

        setIsUploading(true); // Set uploading state to true
        toaster.create({
            title: "Upload en cours...",
            description: "Votre enregistrement est en cours d'envoi.",
            type: "info",
        });

        try {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audioBlob', blob, `oral_${theme}.webm`);

            const result = await uploadRecordingAction(formData, user.uid, theme);


            if (result.success && result.filePath && result.transcriptionId) {
                toaster.create({
                    title: "Upload réussi!",
                    description: "Redirection vers la page de correction.",
                    type: "success",
                });
                // Pass transcriptionId as a query parameter
                router.push(`${result.filePath}`);
            } else {
                console.error("File path is undefined or upload failed:", result.error);
                toaster.create({
                    title: "Erreur d'upload",
                    description: result.error || "Une erreur est survenue lors de l'upload.",
                    type: "error",
                });
            }
        } catch (error) {
            console.error("Error uploading recording:", error)
        } finally {
            setIsUploading(false); // Reset uploading state
            setOpen(false); // Close dialog after attempting upload
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Container maxW="container.md" py={8}>
            <Toaster />
            <Heading size="xl" textAlign="center">{theme}</Heading>
            <Text fontSize="lg" mt={2}>
                {title}
            </Text>
            <Text fontSize="lg" mt={2}>
                Comment analysez-vous cette situation et quelles solutions envisagez-vous ?
            </Text>

            <Box
                width="100%"
                height="120px"
                bg="gray.50"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                overflow="hidden"
            >
                <canvas
                    ref={canvasRef}
                    width="800"
                    height="120"
                    style={{ width: '100%', height: '100%' }}
                />
            </Box>

            <Text
                fontSize="4xl"
                fontWeight="bold"
                fontFamily="mono"
                color={timeLeft <= 30 ? "red.500" : ""}
            >
                {formatTime(timeLeft)}
            </Text>

            <Button
                size="lg"
                height="70px"
                width="220px"
                colorPalette={isRecording ? "red" : "teal"} // Use colorPalette for Chakra UI v2+
                onClick={isRecording ? stopRecording : startRecording}
                boxShadow="md"
                _hover={{ transform: 'scale(1.05)' }}
                transition="all 0.2s"
                borderRadius="full"
                disabled={isUploading} // Disable button when uploading
            >
                {isRecording ? "Arrêter l'enregistrement" : "Démarrer l'enregistrement"}
            </Button>

            <Dialog.Root open={open} onOpenChange={(e) => { if (!isUploading) setOpen(e.open) }}> {/* Prevent closing dialog by clicking outside when uploading */}
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>
                                Enregistrement terminé
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Text>{timeLeft === 0 ? "Le temps est écoulé." : "Vous avez arrêté l'enregistrement."}</Text>
                            <Text>Souhaitez-vous voir la correction ?</Text>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <Button variant="ghost" disabled={isUploading}>
                                    Continuer à réfléchir
                                </Button>
                            </Dialog.CloseTrigger>
                            <Button
                                colorPalette="blue" // Use colorPalette
                                mr={3}
                                onClick={uploadRecording}
                                loading={isUploading} // Show loading spinner
                                loadingText="Envoi..." // Text shown with spinner
                                disabled={isUploading}
                            >
                                Voir la correction !
                            </Button>
                        </Dialog.Footer>
                        {!isUploading && ( // Only show close button if not uploading
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