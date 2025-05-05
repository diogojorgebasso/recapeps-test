'use client';

import { Box, Text, Progress, Flex, Center } from '@chakra-ui/react';

interface SubjectCardProps {
    title: string;
    icon: string;
    progress: number;
    onClick?: () => void;
}

export function SubjectCard({ title, icon, progress, onClick }: SubjectCardProps) {
    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            p={4}
            cursor="pointer"
            onClick={onClick}
            transition="all 0.2s"
            _hover={{
                transform: 'translateY(-4px)',
                boxShadow: 'md'
            }}
            bg="white"
            height="100%"
            display="flex"
            flexDirection="column"
        >
            <Flex align="center" mb={3}>
                <Center
                    bg="blue.50"
                    borderRadius="md"
                    boxSize="40px"
                    fontSize="xl"
                    mr={3}
                >
                    {icon}
                </Center>
                <Text fontWeight="bold" fontSize="md">
                    {title}
                </Text>
            </Flex>

            <Box mt="auto">
                <Flex justify="space-between" mb={1}>
                    <Text fontSize="xs" color="gray.500">
                        Progression
                    </Text>
                    <Text fontSize="xs" fontWeight="bold">
                        {progress}%
                    </Text>
                </Flex>

                <Progress.Root
                    value={progress}
                    size="sm"
                    colorScheme={
                        progress < 30 ? 'red' :
                            progress < 70 ? 'orange' :
                                'green'
                    }
                    borderRadius="full"
                />
            </Box>
        </Box>
    );
}
