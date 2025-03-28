import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Button,
    Spinner,
    Card,
    CardBody,
    Badge,
    Link,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { FaDownload } from "react-icons/fa";
import { FaChevronLeft } from "react-icons/fa6";

interface TranscriptionData {
    transcription: string;
    originalFile: string;
    contentType: string;
    fileSize: number;
    createdAt: {
        toDate: () => Date;
    };
}

export default function Transcription() {
    const { subjectId, transcriptId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<TranscriptionData | null>(null);
    const [subjectTitle, setSubjectTitle] = useState("");

    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    useEffect(() => {
        async function fetchTranscription() {
            if (!currentUser || !transcriptId) {
                setError("Missing user or transcription ID");
                setLoading(false);
                return;
            }

            try {
                const db = getFirestore();
                const transcriptDoc = doc(
                    db,
                    "users",
                    currentUser.uid,
                    "transcripts",
                    transcriptId
                );

                const transcriptSnapshot = await getDoc(transcriptDoc);

                if (transcriptSnapshot.exists()) {
                    setTranscription(transcriptSnapshot.data() as TranscriptionData);
                } else {
                    setError("Transcription not found");
                }

                // Fetch subject title if subjectId exists
                if (subjectId) {
                    const subjectDoc = doc(db, "subjects", subjectId);
                    const subjectSnapshot = await getDoc(subjectDoc);

                    if (subjectSnapshot.exists()) {
                        setSubjectTitle(subjectSnapshot.data()?.title || "");
                    }
                }

            } catch (err) {
                console.error("Error fetching transcription:", err);
                setError("Failed to load transcription");
            } finally {
                setLoading(false);
            }
        }

        fetchTranscription();
    }, [currentUser, transcriptId, subjectId]);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    };

    if (loading) {
        return (
            <Container centerContent py={20}>
                <Spinner size="xl" />
                <Text mt={4}>Loading transcription...</Text>
            </Container>
        );
    }

    if (error) {
        return (
            <Container centerContent py={20}>
                <Heading size="md" color="red.500">Error</Heading>
                <Text mt={4}>{error}</Text>
                <Button mt={6} onClick={() => navigate(-1)}>Go Back</Button>
            </Container>
        );
    }

    return (
        <Container maxW="container.lg" py={8}>
            <VStack gap={6} align="stretch">
                <HStack justify="space-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                    >
                        <FaChevronLeft />
                        Back
                    </Button>

                    {transcription?.originalFile && (
                        <Link
                            href={`/api/download?file=${encodeURIComponent(transcription.originalFile)}`}>
                            <Button size="sm">
                                <FaDownload />  Download Audio
                            </Button>
                        </Link>
                    )}
                </HStack>

                <Heading size="lg">
                    {subjectTitle || "Transcription"}
                </Heading>

                <Card.Root
                    borderWidth="1px"
                    borderColor={borderColor}
                    bg={bgColor}
                    boxShadow="md"
                    borderRadius="md"
                >
                    <Card.Header pb={0}>
                        <VStack align="start" gap={2}>
                            <HStack wrap="wrap" gap={3}>
                                <Badge colorScheme="blue">
                                    {transcription?.contentType || "Unknown format"}
                                </Badge>
                                <Text fontSize="sm" color="gray.500">
                                    {transcription?.createdAt ?
                                        formatDate(transcription.createdAt.toDate()) :
                                        "Unknown date"}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                    {transcription?.fileSize ?
                                        formatFileSize(transcription.fileSize) :
                                        "Unknown size"}
                                </Text>
                            </HStack>
                        </VStack>
                    </Card.Header>

                    <CardBody pt={4}>
                        <Heading size="md" mb={4}>Transcription</Heading>

                        {transcription?.transcription ? (
                            <Box
                                p={4}
                                bg="gray.50"
                                borderRadius="md"
                                borderWidth="1px"
                                borderColor={borderColor}
                                fontSize="md"
                                whiteSpace="pre-wrap"
                            >
                                {transcription.transcription}
                            </Box>
                        ) : (
                            <Text color="gray.500" fontStyle="italic">
                                No transcription available
                            </Text>
                        )}
                    </CardBody>
                </Card.Root>
            </VStack>
        </Container>
    );
}
