'use client';

import { Box, Text, Circle, Tooltip, VStack, useToken } from '@chakra-ui/react';
import { FaCheck, FaLock } from 'react-icons/fa';
import { Quiz } from '../../types';

interface QuizCircleProps {
    quiz: Quiz;
    isLocked: boolean;
    onClick: (quizId: string) => void;
}

export default function QuizCircle({ quiz, isLocked, onClick }: QuizCircleProps) {
    // Color mapping based on difficulty
    const difficultyColorMap = {
        'easy': 'green',
        'medium': 'yellow',
        'hard': 'red'
    };

    const baseColor = difficultyColorMap[quiz.difficulty];
    const [baseLight, baseDark] = useToken(
        'colors',
        [`${baseColor}.100`, `${baseColor}.500`]
    );

    // Determine the style based on completion and locked status
    let bgColor = baseLight;
    let borderColor = baseDark;
    let icon = null;

    if (quiz.completed) {
        bgColor = baseDark;
        icon = <FaCheck color="white" />;
    } else if (isLocked) {
        bgColor = 'gray.100';
        borderColor = 'gray.300';
        icon = <FaLock color="gray" />;
    }

    const handleClick = () => {
        if (!isLocked) {
            onClick(quiz.id);
        }
    };

    return (
        <Tooltip label={isLocked ? "Terminez les leçons précédentes" : quiz.title}>
            <VStack spacing={2}>
                <Circle
                    size="60px"
                    bg={bgColor}
                    border="3px solid"
                    borderColor={borderColor}
                    cursor={isLocked ? "not-allowed" : "pointer"}
                    transition="transform 0.2s, box-shadow 0.2s"
                    _hover={
                        !isLocked ? {
                            transform: "scale(1.05)",
                            boxShadow: "md",
                        } : {}
                    }
                    onClick={handleClick}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    {icon}
                </Circle>
                <Text fontSize="xs" fontWeight="medium" textAlign="center">
                    {quiz.position}
                </Text>
            </VStack>
        </Tooltip>
    );
}
