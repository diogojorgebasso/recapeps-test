'use client';

import { subjects } from './subjects';
import {
    Box, Circle, Flex, Text, VStack,
} from '@chakra-ui/react';
import Link from 'next/link';

import { QuizTrail } from '@/types/Quiz';
import { use } from 'react';

const COLOUR: Record<QuizTrail['state'], string> = {
    completed: 'green.400',
    retry: 'orange.400',
    doing: 'yellow.400',
    unlocked: 'blue.400',
    locked: 'gray.300',
};

export default function SkillTreeClient({ QuizNode }: { QuizNode: Promise<QuizTrail[]> }) {
    const QuizNodes = use(QuizNode);

    const grouped = QuizNodes.reduce<Record<string, QuizTrail[]>>((acc, q) => {
        acc[q.name] ??= [];
        acc[q.name][q.level - 1] = q;
        return acc;
    }, {});

    const circleSize = { base: '48px', md: '64px' };
    const flexGap = { base: 3, md: 4 };

    return (
        <Box maxW="100%" overflowX="auto" p={4}>
            <VStack align="stretch" gap={0}>
                {subjects.map((subj, subjIdx) => (
                    <Flex key={String(subj)} align="center" pos="relative" py={{ base: 3, md: 4 }}>
                        <Text
                            flexShrink={0}
                            w={{ base: '120px', md: '160px' }}
                            fontWeight="bold"
                            fontSize={{ base: 'sm', md: 'md' }}
                        >
                            {subj.toString()}
                        </Text>

                        <Box flex="1" h="2px" bg="gray.300" mr={flexGap} pos="relative">
                            <Box pos="absolute" left="-2px" top="-6px"
                                w="2px" h="calc(100% + 12px)" bg="gray.300" />
                        </Box>

                        <Flex gap={flexGap}>
                            {[1, 2, 3].map(level => {
                                const quiz = grouped[subj.toString()]?.[level - 1];
                                const state: QuizTrail['state'] = quiz ? quiz.state : 'locked';
                                const key = `${subj}-level-${level}`;
                                const isClickable = state !== 'locked';

                                const CircleNode = (
                                    <Circle
                                        size={circleSize}
                                        bg={COLOUR[state]}
                                        color={state === 'locked' ? 'gray.500' : 'white'}
                                        shadow="md"
                                        _hover={isClickable ? {
                                            filter: 'brightness(1.1)',
                                            cursor: 'pointer',
                                        } : {
                                            cursor: 'not-allowed',
                                        }}
                                        as={isClickable ? 'a' : 'div'}
                                    >
                                        <Text fontWeight="bold">{level}</Text>
                                    </Circle>
                                );

                                return (
                                    <Flex key={key} dir="column" align="center">
                                        {isClickable ? (
                                            <Link href={`/parcours/ecrit-1/quiz/${quiz.id}`} passHref>
                                                {CircleNode}
                                            </Link>
                                        ) : (
                                            CircleNode
                                        )}
                                        {subjIdx < subjects.length - 1 && (
                                            <Box w="2px" h={{ base: '24px', md: '32px' }} bg="gray.300" />
                                        )}
                                    </Flex>
                                );
                            })}
                        </Flex>
                    </Flex>
                ))}
            </VStack>
        </Box>
    );
}
