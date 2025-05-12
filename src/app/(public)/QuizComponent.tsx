'use client';

import {
    Box,
    Button,
    Flex,
    Progress,
    Text,
    VStack,
    Heading,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import Link from 'next/link';
import { Question } from "@/types/HomeQuiz";

export default function QuizComponent({ questions, title = "Quiz" }: {
    questions: Question[];
    title: string;
}) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    // Safety check in case questions array is empty
    const question = questions.length > 0 ? questions[currentQuestion] : null;
    const progress = questions.length > 0 ? (currentQuestion / questions.length) * 100 : 0;

    const handleOptionClick = (option: string) => {
        if (!showAnswer) {
            setSelectedOption(option);
        }
    };

    const handleValidation = () => {
        if (question && selectedOption === question.correctAnswer) {
            setScore((prev) => prev + 1);
        }
        setShowAnswer(true);
    };

    const handleNext = () => {
        if (currentQuestion + 1 < questions.length) {
            setCurrentQuestion((prev) => prev + 1);
            setSelectedOption(null);
            setShowAnswer(false);
        } else {
            setIsFinished(true);
        }
    };

    if (!question) {
        return <Box>Chargement des questions...</Box>;
    }

    if (isFinished) {
        return (
            <Box
                textAlign="center"
                p={6}
                rounded="xl"
                shadow="md"
                w={{ base: "90%", md: "600px" }}
                padding={4}
            >
                <Heading size="lg" mb={4}>Quiz terminé !</Heading>
                <Text fontSize="xl" fontWeight="semibold" mb={4}>
                    Votre score : <Text as="span" fontWeight="bold">{score} / {questions.length}</Text>
                </Text>
                <Text mb={8}>
                    Si tu souhaites accéder à plus de contenu et enregistrer ta progression, tu peux créer un compte juste ici 😎
                </Text>
                <Link href="/register">
                    Créer un compte
                </Link>
            </Box>
        );
    }

    return (
        <Box
            w={{ base: "90%", md: "600px" }}
            mx="auto"
            p={4}
            overflow="hidden"
        >
            <Flex justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.500">
                    {title} - Question {currentQuestion + 1}/{questions.length}
                </Text>
            </Flex>

            <Heading as="h2" size="md" mb={4}>
                <Box maxW="100%" >
                    <Text
                        whiteSpace="normal"
                        wordBreak="break-word"
                        overflowWrap="break-word"
                        fontSize={"lg"}
                    >
                        {question.question}
                    </Text>
                </Box>
            </Heading>

            <VStack gap={3} align="stretch">
                {question.options.map((option) => {
                    let bg = 'gray.800';
                    if (showAnswer) {
                        if (option === question.correctAnswer) {
                            bg = 'green.500';
                        } else if (option === selectedOption) {
                            bg = 'red.500';
                        }
                    } else if (option === selectedOption) {
                        bg = 'blue.500';
                    }

                    return (
                        <Button
                            key={option}
                            onClick={() => handleOptionClick(option)}
                            bg={bg}
                            color="white"
                            _hover={{ bg }}
                            disabled={showAnswer}
                            py={6}
                            borderRadius="md"
                            fontSize="md"
                            fontWeight="medium"
                        >
                            <Text
                                whiteSpace="normal"
                                wordBreak="break-word"
                                overflowWrap="break-word"
                            >
                                {option}
                            </Text>
                        </Button>
                    );
                })}
            </VStack>

            <Box mt={6}>
                <Progress.Root value={progress} size="sm" colorPalette="blue" borderRadius="md" >
                    <Progress.Track>
                        <Progress.Range />
                    </Progress.Track>
                    <Progress.ValueText />
                </Progress.Root>
            </Box>

            <Button
                mt={6}
                colorPalette={showAnswer ? 'green' : 'blue'}
                width="100%"
                onClick={showAnswer ? handleNext : handleValidation}
                disabled={!selectedOption && !showAnswer}
            >
                {showAnswer ? 'Suivant' : 'Valider'}
            </Button>
        </Box>
    );
}
