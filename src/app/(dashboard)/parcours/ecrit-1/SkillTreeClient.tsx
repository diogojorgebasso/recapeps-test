// SkillTree.client.tsx  –  "use client"
'use client';
import { subjects } from './subjects';
import {
    Box, Circle, Flex, Text, VStack,
    useBreakpointValue,
} from '@chakra-ui/react';

export type ClientQuiz = {
    id: string;
    subject: string;
    level: number;
    state: 'passed' | 'retry' | 'doing' | 'locked';
};

const COLOUR: Record<ClientQuiz['state'], string> = {
    passed: 'green.400',
    retry: 'orange.400',
    doing: 'blue.400',
    locked: 'gray.300',
};


export default function SkillTreeClient({ quizzes }: { quizzes: ClientQuiz[] }) {
    /* group by subject─level */
    const grouped = quizzes.reduce<Record<string, ClientQuiz[]>>((acc, q) => {
        acc[q.subject] ??= [];
        acc[q.subject][q.level - 1] = q;
        return acc;
    }, {});

    const size = useBreakpointValue({ base: '48px', md: '64px' });
    const gap = useBreakpointValue({ base: 3, md: 4 });

    return (
        <Box maxW="100%" overflowX="auto" p={4}>
            <VStack align="stretch" gap={0}>
                {subjects.map((subj, idx) => (
                    <Flex key={subj} align="center" pos="relative" py={{ base: 3, md: 4 }}>
                        <Text
                            flexShrink={0}
                            w={{ base: '120px', md: '160px' }}
                            fontWeight="bold"
                            fontSize={{ base: 'sm', md: 'md' }}
                        >
                            {subj}
                        </Text>

                        {/* branch */}
                        <Box flex="1" h="2px" bg="gray.300" mr={gap} pos="relative">
                            <Box pos="absolute" left="-2px" top="-6px"
                                w="2px" h="calc(100% + 12px)" bg="gray.300" />
                        </Box>

                        {/* 3 circles */}
                        <Flex gap={gap}>
                            {(grouped[subj] ?? []).map(q => (
                                <Flex key={q.id} dir="column" align="center">
                                    <Circle
                                        size={size}
                                        bg={COLOUR[q.state]}
                                        color={q.state === 'locked' ? 'gray.500' : 'white'}
                                        shadow="md"
                                        _hover={{
                                            filter: q.state !== 'locked' ? 'brightness(1.1)' : undefined,
                                            cursor: q.state !== 'locked' ? 'pointer' : 'not-allowed',
                                        }}
                                    >
                                        <Text fontWeight="bold">{q.level}</Text>
                                    </Circle>
                                    {idx < subjectOrder.length - 1 && (
                                        <Box w="2px" h={{ base: '24px', md: '32px' }} bg="gray.300" />
                                    )}
                                </Flex>
                            ))}
                        </Flex>
                    </Flex>
                ))}
            </VStack>
        </Box>
    );
}
