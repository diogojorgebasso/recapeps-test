'use client';

import { Box, Text, Center, Tooltip } from '@chakra-ui/react';

interface AchievementBadgeProps {
    title: string;
    icon: string;
    achieved: boolean;
    description?: string;
}

export function AchievementBadge({ title, icon, achieved, description }: AchievementBadgeProps) {
    return (
        <Tooltip
            label={description || (achieved ? `Badge débloqué : ${title}` : `Badge verrouillé : ${title}`)}
            placement="top"
        >
            <Box textAlign="center">
                <Center
                    boxSize="60px"
                    bg={achieved ? 'green.100' : 'gray.100'}
                    color={achieved ? 'green.500' : 'gray.400'}
                    borderRadius="md"
                    mb={2}
                    border="2px"
                    borderColor={achieved ? 'green.200' : 'gray.200'}
                    fontSize="2xl"
                    opacity={achieved ? 1 : 0.6}
                    filter={achieved ? 'none' : 'grayscale(1)'}
                    transition="all 0.2s"
                    cursor="pointer"
                    _hover={{
                        transform: achieved ? 'scale(1.05)' : 'none',
                        boxShadow: achieved ? 'md' : 'none'
                    }}
                >
                    {icon}
                </Center>
                <Text fontSize="xs" fontWeight={achieved ? 'medium' : 'normal'} isTruncated>
                    {title}
                </Text>
            </Box>
        </Tooltip>
    );
}
