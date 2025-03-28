'use client';

import { Box, Text, Image, Flex, Badge, CircularProgress, CircularProgressLabel } from '@chakra-ui/react';
import { Subject } from '../../types';

interface SubjectCardProps {
    subject: Subject;
}

export default function SubjectCard({ subject }: SubjectCardProps) {
    const progress = Math.round((subject.chaptersRead / subject.totalChapters) * 100);
    const isComplete = subject.chaptersRead === subject.totalChapters;

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            boxShadow="md"
            transition="transform 0.3s, box-shadow 0.3s"
            _hover={{ transform: "translateY(-4px)", boxShadow: "lg" }}
            bg="white"
            height="100%"
            display="flex"
            flexDirection="column"
        >
            <Box position="relative" height="150px" overflow="hidden">
                <Image
                    src={subject.imageUrl || '/images/default-subject.jpg'}
                    alt={subject.title}
                    objectFit="cover"
                    width="100%"
                    height="100%"
                />

                <Flex
                    position="absolute"
                    top={2}
                    right={2}
                >
                    <Box
                        bg="white"
                        borderRadius="full"
                        p={1}
                        boxShadow="md"
                    >
                        <CircularProgress
                            value={progress}
                            color={isComplete ? "green.500" : "blue.500"}
                            size="40px"
                        >
                            <CircularProgressLabel fontSize="xs">
                                {isComplete ? '✓' : `${progress}%`}
                            </CircularProgressLabel>
                        </CircularProgress>
                    </Box>
                </Flex>
            </Box>

            <Box p={4} flexGrow={1} display="flex" flexDirection="column">
                <Flex justify="space-between" align="start" mb={2}>
                    <Text fontWeight="semibold" fontSize="lg" noOfLines={1}>
                        {subject.title}
                    </Text>

                    {isComplete && (
                        <Badge colorScheme="green" variant="solid" fontSize="xs" borderRadius="full">
                            Terminé
                        </Badge>
                    )}
                </Flex>

                <Text fontSize="sm" color="gray.600" mb={3} flexGrow={1} noOfLines={3}>
                    {subject.description}
                </Text>

                <Flex justifyContent="space-between" alignItems="center" pt={1}>
                    <Text fontSize="xs" color="gray.500">
                        {subject.chaptersRead} / {subject.totalChapters} chapitres
                    </Text>
                </Flex>
            </Box>
        </Box>
    );
}
