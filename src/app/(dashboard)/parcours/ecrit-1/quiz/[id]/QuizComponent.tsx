'use client'

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Quiz } from "@/types/Quiz";
import { useAuth } from "@/components/AuthProvider";
import { saveQuizResultsAction, saveQuizProgressAction } from "./actions";

import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  Stack,
  Center,
  Progress,
  Flex,
} from "@chakra-ui/react";

import { Toaster, toaster } from "@/components/ui/toaster"

enum QuizState {
  QUESTION_DISPLAY,
  FEEDBACK_DISPLAY,
  QUIZ_COMPLETED,
}

interface QuestionResult {
  questionId: string;
  selectedAnswerIds: string[];
  timeSpent: number; // Time in milliseconds
}

export type QuizPageClientProps = {
  quiz: Quiz;
};

export default function QuizComponent({
  quiz,
}: QuizPageClientProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // State machine
  const [quizState, setQuizState] = useState<QuizState>(
    quiz.questions.length > 0 ? QuizState.QUESTION_DISPLAY : QuizState.QUIZ_COMPLETED
  );

  // State for timing
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [quizResults, setQuizResults] = useState<QuestionResult[]>([]);

  const { user } = useAuth();
  const router = useRouter();

  const handleSaveResults = useCallback(async () => {
    if (!quiz.subjectId || !user) {
      console.error("Missing subjectId or user for saving.");
      toaster.create({
        title: "Erreur: Impossible de sauvegarder les résultats.",
        type: "error",
      });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        subjectId: quiz.subjectId,
        score: score,
        totalQuestions: quiz.questions.length,
        questions: quizResults,
      };
      const result = await saveQuizResultsAction(payload);

      if (result.success) {
        console.log("Quiz results saved successfully via server action.", result);
      } else {
        toaster.create({
          title: "Erreur lors de la sauvegarde du quiz.",
          description: result.error,
          type: "error",
        });
      }
    } catch (error) {
      toaster.create({
        title: "Erreur technique lors de la sauvegarde.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [quiz.subjectId, score, quiz.questions.length, quizResults, user]);

  const handleSelectOption = (answerId: string) => {
    if (quizState !== QuizState.QUESTION_DISPLAY) return;
    setSelectedAnswerIds([answerId]);
  };

  const handleValidation = () => {
    setQuizState(QuizState.FEEDBACK_DISPLAY);
  };

  const handleNextQuestion = () => {
    const timeSpent = Date.now() - questionStartTime;
    const currentQuestion = quiz.questions[currentQuestionIndex];

    // Add result for the current question
    const newResult: QuestionResult = {
      questionId: currentQuestion.id,
      selectedAnswerIds: [...selectedAnswerIds],
      timeSpent: timeSpent,
    };
    setQuizResults(prevResults => [...prevResults, newResult]);

    // Check if answer is correct
    const isAnswerCorrect = currentQuestion.answers
      .filter(answer => selectedAnswerIds.includes(answer.id))
      .every(answer => answer.isCorrect);

    const areAllCorrectAnswersSelected = currentQuestion.answers
      .filter(answer => answer.isCorrect)
      .every(answer => selectedAnswerIds.includes(answer.id));

    if (isAnswerCorrect && areAllCorrectAnswersSelected) {
      setScore((prevScore) => prevScore + 1);
    }

    // Move to next question or finish
    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < quiz.questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setSelectedAnswerIds([]);
      setQuizState(QuizState.QUESTION_DISPLAY);
      setQuestionStartTime(Date.now());
    } else {
      setQuizState(QuizState.QUIZ_COMPLETED);
      handleSaveResults();
    }
  };

  const handleSaveForLater = async () => {
    if (!quiz.subjectId || !user) return;
    setIsSaving(true);
    toaster.create({
      title: "Sauvegarde en cours...",
      type: "info"
    });

    const timeSpentCurrent = Date.now() - questionStartTime;
    const currentResultsSnapshot = [
      ...quizResults,
      // Include current question's partial result if needed
    ];

    try {
      const result = await saveQuizProgressAction(
        quiz.subjectId,
        currentQuestionIndex,
        score,
        currentResultsSnapshot
      );
      if (result.success) {
        toaster.create({
          title: "Progrès sauvegardé (fonctionnalité à venir)!",
          type: "success",
        });
      } else {
        toaster.create({
          title: "Erreur lors de la sauvegarde.",
          description: result.error,
          type: "error",
        });
      }
    }
    catch (error) {
      toaster.create({
        title: "Erreur technique lors de la sauvegarde.",
        type: "error",
      });
    }
    finally {
      setIsSaving(false);
    }
  };

  if (quiz.questions.length === 0) {
    return (
      <Center w={"100%"} h={"100vh"} >
        <Text fontSize="lg" > Aucune question disponible pour ce quiz.</Text>
        <Button ml={4} onClick={() =>
          router.back()}> Retour
        </Button>
      </Center >
    );
  }

  if (quizState === QuizState.QUIZ_COMPLETED) {
    return (
      <Center w="100%" h="100vh" p={4} >
        <Card maxW="md" w="full" boxShadow="lg" >
          <CardBody p={4}>
            <Heading size="md" mb={4} > Quiz terminé! </Heading>
            <Text fontSize="lg" mb={2} >
              Score: {score}/{quiz.questions.length}
            </Text>
            <Text mb={4} >
              {score === quiz.questions.length
                ? "Parfait! Vous avez répondu correctement à toutes les questions."
                : `Vous avez obtenu ${(score / quiz.questions.length * 100).toFixed(0)}% de réponses correctes.`
              }
            </Text>
            <Button
              width="full"
              mt={6}
              colorScheme="blue"
              onClick={() => router.push("/ecrit-1")}
              loading={isSaving}
            >
              Retour aux sujets
            </Button>
          </CardBody>
        </Card>
      </Center>
    );
  }

  // Active Quiz State
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const showFeedback = quizState === QuizState.FEEDBACK_DISPLAY;

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      bg="gray.50"
    >
      <Card maxW="2xl" w="full" boxShadow="lg" position="relative" >
        <CardBody>
          <Heading size="md" mb={4} >{currentQuestion.question}</Heading>
          <Stack gap={4} >
            {currentQuestion.answers.map((answer) => {
              const isCorrect = answer.isCorrect;
              const isSelected = selectedAnswerIds.includes(answer.id);

              let colorScheme = "gray";
              if (showFeedback) {
                if (isCorrect) colorScheme = "green";
                else if (isSelected && !isCorrect) colorScheme = "red";
              } else if (isSelected) {
                colorScheme = "blue";
              }

              return (
                <Button
                  key={answer.id}
                  colorScheme={colorScheme}
                  variant={isSelected || showFeedback ? "solid" : "outline"}
                  onClick={() => handleSelectOption(answer.id)}
                  textAlign="left"
                  whiteSpace="normal"
                  wordBreak="break-word"
                  disabled={showFeedback || isSaving}
                  width="100%"
                  minH={16}
                  p={4}
                  justifyContent="flex-start"
                  height="auto"
                >
                  {answer.answer}
                </Button>
              );
            })}
          </Stack>

          {/* Show explanation when in feedback mode */}
          {showFeedback && currentQuestion.explanation && (
            <Box mt={4} p={3} bg="blue.50" borderRadius="md">
              <Text fontWeight="bold">Explication:</Text>
              <Text>{currentQuestion.explanation}</Text>
            </Box>
          )}

          {/* Progress Bar */}
          <Box mt={6}>
            <Flex justify="space-between" mb={1} >
              <Text fontSize="xs" color="gray.600" >
                Question {currentQuestionIndex + 1} / {quiz.questions.length}
              </Text>
              <Text fontSize="xs" color="gray.600" >
                {progress.toFixed(0)} %
              </Text>
            </Flex>
            <Progress value={progress} size="sm" borderRadius="md" colorScheme="blue" />
          </Box>

          {/* Action Buttons */}
          <Flex mt={6} direction={{ base: "column", sm: "row" }} gap={3} >
            <Button
              flex={1}
              colorScheme="gray"
              variant="outline"
              onClick={handleSaveForLater}
              loading={isSaving}
              disabled={isSaving || showFeedback}
            >
              Sauvegarder pour plus tard
            </Button>
            <Button
              flex={2}
              colorScheme="blue"
              disabled={selectedAnswerIds.length === 0 || isSaving}
              loading={isSaving && showFeedback}
              onClick={showFeedback ? handleNextQuestion : handleValidation}
            >
              {showFeedback ? "Question Suivante" : "Valider"}
            </Button>
          </Flex>
        </CardBody>
      </Card>
    </Box>
  );
}
