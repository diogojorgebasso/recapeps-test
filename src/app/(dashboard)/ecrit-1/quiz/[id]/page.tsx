'use client'; // This component uses hooks, so it needs to be a Client Component

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; // Use next/navigation
import { fetchQuizzesBySubject } from "@/api/getQuizzesFromFirebase";
import { Quiz } from "@/types/Quiz";
import { useAuth } from "@/components/AuthProvider";
import { saveQuizResultsAction, saveQuizProgressAction } from "@/app/(dashboard)/ecrit-1/quiz/[id]/actions"; // Import server actions

import {
    Box,
    Button,
    Card,
    Heading,
    Text,
    Badge,
    Stack,
    Center,
    Spinner,
    Flex,
    Progress
} from "@chakra-ui/react";

// Define structure for detailed results including time
interface QuestionResult {
    questionId: string;
    selectedAnswer: number[];
    timeSpent: number; // Time in milliseconds
}

// Accept params prop for dynamic routing
export default function QuizPage({ params }: { params: { id: string } }) {
    const router = useRouter(); // Use Next.js router
    const { id: subjectId } = params; // Get subjectId from params

    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Loading state for fetching
    const [isSaving, setIsSaving] = useState(false); // Saving state for server actions

    // State for timing
    const [questionStartTime, setQuestionStartTime] = useState<number>(0);
    const [quizResults, setQuizResults] = useState<QuestionResult[]>([]);

    const { user } = useAuth();

    // Fetch quizzes
    useEffect(() => {
        const loadQuiz = async () => {
            setIsLoading(true);
            if (subjectId && user) {
                try {
                    const fetchedQuizzes = await fetchQuizzesBySubject(subjectId, currentUser.uid);
                    setQuizzes(fetchedQuizzes);
                    if (fetchedQuizzes.length > 0) {
                        setQuestionStartTime(Date.now()); // Start timer for the first question
                    } else {
                        // Handle case where no quizzes are found
                        toast({ title: "Aucun quiz trouvé pour ce sujet.", status: "warning", duration: 3000, isClosable: true });
                    }
                } catch (error) {
                    console.error("Error loading quizzes:", error);
                    toast({ title: "Erreur lors du chargement du quiz.", status: "error", duration: 3000, isClosable: true });
                } finally {
                    setIsLoading(false);
                }
            } else if (!currentUser) {
                // Handle case where user is not logged in (though useAuth should handle redirects)
                setIsLoading(false);
                toast({ title: "Veuillez vous connecter pour accéder au quiz.", status: "info", duration: 3000, isClosable: true });
                router.push('/login'); // Redirect to login if not authenticated
            }
        };
        loadQuiz();
    }, [subjectId, currentUser, router, toast]); // Add dependencies

    // Save results when finished using server action
    const handleSaveResults = useCallback(async () => {
        if (!subjectId || !currentUser) {
            console.error("Missing subjectId or user for saving.");
            toast({ title: "Erreur: Impossible de sauvegarder les résultats.", status: "error", duration: 3000, isClosable: true });
            return;
        }
        setIsSaving(true);
        try {
            const payload = {
                subjectId: subjectId,
                score: score,
                totalQuestions: quizzes.length,
                questions: quizResults,
            };
            const result = await saveQuizResultsAction(payload);

            if (result.success) {
                console.log("Quiz results saved successfully via server action.", result);
                // Optionally show streak info: `result.streak`
            } else {
                console.error("Failed to save quiz results via server action:", result.error);
                toast({ title: "Erreur lors de la sauvegarde du quiz.", description: result.error, status: "error", duration: 5000, isClosable: true });
            }
        } catch (error) {
            console.error("Error calling saveQuizResultsAction:", error);
            toast({ title: "Erreur technique lors de la sauvegarde.", status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsSaving(false); // Ensure saving state is reset even on error
            // The finish screen is displayed regardless of save success for now
        }
    }, [subjectId, score, quizzes.length, quizResults, currentUser, toast]); // Add dependencies

    // Trigger save when isFinished becomes true
    useEffect(() => {
        if (isFinished) {
            handleSaveResults();
        }
    }, [isFinished, handleSaveResults]);


    const handleSelectOption = (optionIndex: number) => {
        // ... existing code ...
    };

    const handleValidation = () => {
        // ... existing code ...
    };

    const handleNextQuestion = () => {
        const timeSpent = Date.now() - questionStartTime; // Calculate time spent
        const currentQuiz = quizzes[currentQuestion];
        const correctAnswers = currentQuiz.answers as number[];

        // Add result for the current question
        const newResult: QuestionResult = {
            questionId: currentQuiz.id,
            selectedAnswer: [...selectedAnswers], // Clone selected answers
            timeSpent: timeSpent,
        };
        setQuizResults(prevResults => [...prevResults, newResult]);

        // Check correctness
        const sameSize = selectedAnswers.length === correctAnswers.length;
        const allIncluded = selectedAnswers.every((idx) => correctAnswers.includes(idx));
        const isSymmetric = correctAnswers.every((idx) => selectedAnswers.includes(idx));

        if (sameSize && allIncluded && isSymmetric) {
            setScore((prevScore) => prevScore + 1);
        }

        // Move to next question or finish
        const nextQuestion = currentQuestion + 1;
        if (nextQuestion < quizzes.length) {
            setCurrentQuestion(nextQuestion);
            setSelectedAnswers([]);
            setShowFeedback(false);
            setQuestionStartTime(Date.now()); // Reset timer for the next question
        } else {
            setIsFinished(true); // Trigger finish state
        }
    };

    // Handle Save for Later action
    const handleSaveForLater = async () => {
        if (!subjectId || !currentUser) return;
        setIsSaving(true); // Show saving indicator
        toast({ title: "Sauvegarde en cours...", status: "info", duration: 1500 });

        const timeSpentCurrent = Date.now() - questionStartTime;
        const currentResultsSnapshot = [
            ...quizResults,
            // Include current question's partial result if needed
            // { questionId: quizzes[currentQuestion].id, selectedAnswer: selectedAnswers, timeSpent: timeSpentCurrent }
        ];

        try {
            // Call the server action (currently a placeholder)
            const result = await saveQuizProgressAction(
                subjectId,
                currentQuestion,
                score,
                currentResultsSnapshot // Send accumulated results so far
            );
            if (result.success) {
                toast({ title: "Progrès sauvegardé (fonctionnalité à venir)!", status: "success", duration: 3000, isClosable: true });
                // Optionally navigate away or provide further instructions
                // router.push('/dashboard'); // Example: navigate back after saving
            } else {
                toast({ title: "Erreur lors de la sauvegarde.", description: result.error, status: "error", duration: 5000, isClosable: true });
            }
        } catch (error) {
            toast({ title: "Erreur technique lors de la sauvegarde.", status: "error", duration: 5000, isClosable: true });
        } finally {
            setIsSaving(false);
        }
    };


    // Loading State
    if (isLoading) {
        return (
            <Center w="100%" h="100vh">
                <Spinner size="xl" />
                <Text ml={4} fontSize="lg">Chargement du quiz&hellip;</Text>
            </Center>
        );
    }

    // No Quizzes Found State (after loading)
    if (!isLoading && quizzes.length === 0 && !isFinished) {
        return (
            <Center w="100%" h="100vh">
                <Text fontSize="lg">Aucun quiz disponible pour ce sujet.</Text>
                <Button ml={4} onClick={() => router.back()}>Retour</Button>
            </Center>
        );
    }


    // Finished State
    if (isFinished) {
        // ... existing finished screen code ...
        // Make sure the button uses the Next.js router
        return (
            <Center w="100%" h="100vh" p={4}>
                <Card maxW="md" w="full" p={4} boxShadow="lg">
                    {/* ... existing Card.Header ... */}
                    <Card.Body>
                        {/* ... existing score and message Text ... */}
                        <Button
                            width="full"
                            mt={6}
                            colorScheme="blue" // Use colorScheme for Chakra UI v2+
                            onClick={() => router.push("/ecrit-1")} // Navigate to subject list or dashboard
                            isLoading={isSaving} // Show loading state if saving is slow
                        >
                            Retour aux sujets
                        </Button>
                    </Card.Body>
                </Card>
            </Center>
        );
    }

    // Active Quiz State
    const currentQuiz = quizzes[currentQuestion];
    const progress = ((currentQuestion + 1) / quizzes.length) * 100; // Show progress for current question number

    return (
        <Box
            minH="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
            bg="gray.50" // Add a subtle background
        >
            <Card maxW="2xl" w="full" boxShadow="lg" position="relative">
                {/* ... existing Card.Header with Badge ... */}

                <Card.Body>
                    <Stack gap={4}>
                        {currentQuiz.options.map((option, index) => {
                            const isCorrect = currentQuiz.answers.includes(index);
                            const isSelected = selectedAnswers.includes(index);

                            let colorScheme = "gray"; // Use colorScheme
                            if (showFeedback) {
                                if (isCorrect) colorScheme = "green";
                                else if (isSelected && !isCorrect) colorScheme = "red";
                            } else if (isSelected) {
                                colorScheme = "blue";
                            }

                            return (
                                <Button
                                    key={index}
                                    colorScheme={colorScheme} // Use colorScheme
                                    variant={isSelected || showFeedback ? "solid" : "outline"} // Visual distinction
                                    onClick={() => handleSelectOption(index)}
                                    textAlign="left"
                                    whiteSpace="normal"
                                    wordBreak="break-word"
                                    isDisabled={showFeedback || isSaving} // Disable during feedback and saving
                                    width="100%"
                                    minH={16} // Adjust height if needed
                                    p={4} // Add padding
                                    justifyContent="flex-start" // Align text left
                                    height="auto" // Allow button to grow
                                >
                                    {option}
                                </Button>
                            );
                        })}
                    </Stack>

                    {/* Progress Bar */}
                    <Box mt={6}> {/* Increased margin */}
                        <Flex justify="space-between" mb={1}>
                            <Text fontSize="xs" color="gray.600">{`Question ${currentQuestion + 1} / ${quizzes.length}`}</Text>
                            <Text fontSize="xs" color="gray.600">{`${progress.toFixed(0)}%`}</Text>
                        </Flex>
                        <ProgressRoot value={progress} size="sm" borderRadius="md"> {/* Adjusted size */}
                            <ProgressBar colorScheme="blue" /> {/* Use colorScheme */}
                        </ProgressRoot>
                    </Box>

                    {/* Action Buttons */}
                    <Flex mt={6} direction={{ base: "column", sm: "row" }} gap={3}>
                        <Button
                            flex={1} // Allow button to grow
                            colorScheme="gray" // Style for secondary action
                            variant="outline"
                            onClick={handleSaveForLater}
                            isLoading={isSaving}
                            isDisabled={isSaving || showFeedback} // Disable if already validating/saving
                        >
                            Sauvegarder pour plus tard
                        </Button>
                        <Button
                            flex={2} // Make primary action wider
                            colorScheme="blue"
                            isDisabled={selectedAnswers.length === 0 || isSaving} // Disable if no answer or saving
                            isLoading={isSaving && showFeedback} // Show loading only if saving during next question transition
                            onClick={showFeedback ? handleNextQuestion : handleValidation}
                        >
                            {showFeedback ? "Question Suivante" : "Valider"}
                        </Button>
                    </Flex>
                </Card.Body>
            </Card>
        </Box>
    );
}
