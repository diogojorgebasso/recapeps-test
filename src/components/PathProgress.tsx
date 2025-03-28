'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Quiz } from '../../types';
import QuizCircle from './QuizCircle';
import { useMemo } from 'react';

interface PathProgressProps {
    quizzes: Quiz[];
    onQuizSelect: (quizId: string) => void;
}

export default function PathProgress({ quizzes, onQuizSelect }: PathProgressProps) {
    // Sort quizzes by position
    const sortedQuizzes = useMemo(() => {
        return [...quizzes].sort((a, b) => a.position - b.position);
    }, [quizzes]);

    // Group quizzes into rows (5 per row)
    const quizRows = useMemo(() => {
        const rows: Quiz[][] = [];
        let currentRow: Quiz[] = [];

        sortedQuizzes.forEach((quiz, index) => {
            currentRow.push(quiz);
            if ((index + 1) % 5 === 0 || index === sortedQuizzes.length - 1) {
                rows.push(currentRow);
                currentRow = [];
            }
        });

        return rows;
    }, [sortedQuizzes]);

    // Determine if a quiz should be locked
    // A quiz is unlocked if all previous quizzes are completed or it's the first uncompleted quiz
    const isQuizLocked = (quiz: Quiz, index: number): boolean => {
        // First quiz is always unlocked
        if (index === 0) return false;

        // If this quiz is already completed, it's not locked
        if (quiz.completed) return false;

        // Find the previous quiz
        const prevQuiz = sortedQuizzes[index - 1];

        // If the previous quiz is completed, this one is unlocked
        if (prevQuiz && prevQuiz.completed) return false;

        // Otherwise, it's locked
        return true;
    };

    return (
        <Box maxW="800px" mx="auto" my={6}>
            {quizRows.map((row, rowIndex) => (
                <Box key={rowIndex} mb={10} position="relative">
                    {/* Path line */}
                    <Box
                        position="absolute"
                        height="2px"
                        bg="gray.200"
                        top="30px"
                        left="30px"
                        right="30px"
                        zIndex={0}
                    />

                    <Flex justify="space-between" position="relative" zIndex={1}>
                        {row.map((quiz, index) => {
                            const globalIndex = rowIndex * 5 + index;
                            const locked = isQuizLocked(quiz, globalIndex);

                            return (
                                <QuizCircle
                                    key={quiz.id}
                                    quiz={quiz}
                                    isLocked={locked}
                                    onClick={onQuizSelect}
                                />
                            );
                        })}
                    </Flex>
                </Box>
            ))}
        </Box>
    );
}
