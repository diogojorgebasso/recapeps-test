'use client';

import { useState, useEffect } from 'react';
import { Box, Text, HStack, VStack, Progress, Badge, useToast } from '@chakra-ui/react';
import { FaFire } from 'react-icons/fa';
import { getUserStreak } from '../app/actions/firestoreQueries';

interface StreakTrackerProps {
    userId: string;
}

export default function StreakTracker({ userId }: StreakTrackerProps) {
    const [streak, setStreak] = useState({
        currentStreak: 0,
        longestStreak: 0,
        lastCompletionDate: '',
    });
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        async function loadStreak() {
            try {
                const userStreak = await getUserStreak(userId);
                setStreak(userStreak);

                // If they maintained their streak today, show a congratulatory message
                const lastCompletion = userStreak.lastCompletionDate ? new Date(userStreak.lastCompletionDate) : null;
                const today = new Date();
                if (lastCompletion &&
                    lastCompletion.getDate() === today.getDate() &&
                    lastCompletion.getMonth() === today.getMonth() &&
                    lastCompletion.getFullYear() === today.getFullYear()) {
                    toast({
                        title: 'Félicitations!',
                        description: `Vous avez maintenu votre série pendant ${userStreak.currentStreak} jours!`,
                        status: 'success',
                        duration: 5000,
                        isClosable: true,
                    });
                }
            } catch (error) {
                console.error("Failed to load streak data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadStreak();
    }, [userId, toast]);

    return (
        <Box
            p={4}
            bg="orange.50"
            borderRadius="lg"
            mb={4}
            border="1px"
            borderColor="orange.200"
        >
            <HStack spacing={4} align="center">
                <Box position="relative" display="flex" alignItems="center" justifyContent="center">
                    <Box
                        bg="orange.100"
                        borderRadius="full"
                        p={2}
                        position="relative"
                        overflow="hidden"
                    >
                        <FaFire size="32px" color="#ED8936" />
                        <Progress
                            value={streak.currentStreak > 30 ? 100 : (streak.currentStreak / 30) * 100}
                            colorScheme="orange"
                            size="sm"
                            position="absolute"
                            bottom="0"
                            left="0"
                            right="0"
                            borderRadius="0"
                            height="3px"
                        />
                    </Box>
                </Box>

                <VStack align="start" spacing={0}>
                    <HStack>
                        <Text fontWeight="bold" fontSize="xl">{streak.currentStreak}</Text>
                        <Text fontSize="md">jours</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                        Série actuelle
                    </Text>
                </VStack>

                {streak.currentStreak >= 7 && (
                    <Badge colorScheme="green" ml={2}>
                        1 semaine!
                    </Badge>
                )}

                {streak.longestStreak > streak.currentStreak && (
                    <VStack align="start" spacing={0} ml={4}>
                        <Text fontSize="sm">Record: {streak.longestStreak} jours</Text>
                    </VStack>
                )}
            </HStack>
        </Box>
    );
}
