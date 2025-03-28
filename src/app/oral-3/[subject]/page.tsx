import { getSpecifyOral } from "@/api/getSpecifyOral";
import { useParams } from "react-router";
import { useState, useRef, useEffect } from "react";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "@/hooks/useAuth";

import {
    Box,
    Button,
    Center,
    Heading,
    Text,
    VStack,
    Dialog,
    Container,
    CloseButton
} from "@chakra-ui/react";
import { useNavigate } from "react-router";

export default function Subject() {
    const [title, setTitle] = useState("");
    const router = useParams();
    const { subjectId } = router;
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(180);
    const [open, setOpen] = useState(false)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refs for audio visualization
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (subjectId) {
            getSpecifyOral(subjectId).then(data => {
                console.log(data);
                setTitle(data.data()?.title || "");
            });
        }
    }, [subjectId]);

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
    }, [timeLeft, isRecording]);

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

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();

            // Stop all audio tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            setIsRecording(false);

            // Stop visualization
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
    };

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
        if (audioChunksRef.current.length === 0) return;

        try {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const storage = getStorage();
            const fileName = `oral_${subjectId}_${Date.now()}.webm`;
            if (!currentUser) {
                throw new Error("User is not authenticated");
            }
            const storageRef = ref(storage, `user/${currentUser.uid}/transcripts/${fileName}`);

            await uploadBytes(storageRef, blob);
            setOpen(false)

            navigate(`/oral-3/${subjectId}/transcripts/${fileName.split('.')[0]}`);
        } catch (error) {
            console.error("Error uploading recording:", error);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Container maxW="container.md" py={8}>
            <VStack gap={8}>
                <Center>
                    <Heading size="xl" textAlign="center">{title}</Heading>
                </Center>

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
                    colorPalette={isRecording ? "red" : "teal"}
                    onClick={isRecording ? stopRecording : startRecording}
                    boxShadow="md"
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                    borderRadius="full"
                >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
            </VStack>

            <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>
                                Enregistrement terminé
                            </Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Text>Le temps est écoulé</Text>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="ghost">
                                    Continuer à réfléchir
                                </Button>
                            </Dialog.ActionTrigger>
                            <Dialog.ActionTrigger asChild>
                                <Button colorPalette="blue" mr={3} onClick={uploadRecording}>
                                    Voir la correction !
                                </Button>
                            </Dialog.ActionTrigger>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Dialog.Root>
        </Container>
    );
}