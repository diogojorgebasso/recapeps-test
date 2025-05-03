'use client';

import { Box, Flex, Circle, Text, useBreakpointValue } from '@chakra-ui/react';

interface PathStep {
    id: string;
    name: string;
    path: string;
}

// Define the learning path steps
const learningPath: PathStep[] = [
    { id: 'flashcards', name: 'Flashcards', path: '/flashcards' },
    { id: 'quiz', name: 'Quiz', path: '/quiz' },
    { id: 'notes', name: 'Notes', path: '/notes' },
    { id: 'oral', name: 'Oral', path: '/oral-3' },
];

interface PathProgressProps {
    currentPath: string;
}

export function PathProgress({ currentPath }: PathProgressProps) {
    // Responsive line width
    const lineWidth = useBreakpointValue({ base: '40px', sm: '60px', md: '100px' });

    // Determine the active step
    const currentStepIndex = learningPath.findIndex(step =>
        currentPath.includes(step.path)
    );

    return (
        <Flex justify="center" align="center">
            {learningPath.map((step, index) => (
                <Flex key={step.id} align="center">
                    {/* Step circle */}
                    <Flex direction="column" align="center">
                        <Circle
                            size="40px"
                            bg={index <= currentStepIndex ? 'blue.500' : 'gray.200'}
                            color="white"
                            fontWeight="bold"
                        >
                            {index + 1}
                        </Circle>
                        <Text
                            mt={2}
                            fontSize="sm"
                            fontWeight={index <= currentStepIndex ? 'semibold' : 'normal'}
                            color={index <= currentStepIndex ? 'gray.800' : 'gray.500'}
                        >
                            {step.name}
                        </Text>
                    </Flex>

                    {/* Connecting line (except after last item) */}
                    {index < learningPath.length - 1 && (
                        <Box
                            height="2px"
                            width={lineWidth}
                            bg={index < currentStepIndex ? 'blue.500' : 'gray.200'}
                            mx={2}
                        />
                    )}
                </Flex>
            ))}
        </Flex>
    );
}
