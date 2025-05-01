'use client';

import { useState, useEffect } from 'react';
import { Box, Text, HStack, VStack, Progress, Badge, useToast, Flex, Circle, Tooltip } from '@chakra-ui/react';
import { FaFire } from 'react-icons/fa';
import { fetchUserStreak, updateUserStreak } from '../app/actions/firestoreQueries';

interface SimpleStreakTrackerProps {
    days: number;
    maxDisplay?: number;
}

// Simple streak tracker for dashboard display
export function StreakTracker({ days, maxDisplay = 7 }: SimpleStreakTrackerProps) {
    // Create an array representing the last N days
    const daysArray = Array.from({ length: maxDisplay }, (_, i) => {
        // Whether this day is part of the streak (starting from the most recent day)
        const isActive = i < days;
        return { day: maxDisplay - i, isActive };
    }).reverse(); // Reverse to show oldest to newest (left to right)

    return (
        <Box py={2}>
            <Flex justify="space-between" align="center">
                {daysArray.map((day, index) => (
                    <Tooltip
                        key={index}
                        label={day.isActive ? 'Jour actif' : 'Jour inactif'}
                        placement="top"
                    >
                        <Box textAlign="center">
                            <Circle
                                size="30px"
                                bg={day.isActive ? 'green.400' : 'gray.200'}
                                color={day.isActive ? 'white' : 'gray.500'}
                                mb={1}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {day.day}
                            </Circle>
                        </Box>
                    </Tooltip>
                ))}
            </Flex>
            <Flex justify="space-between" mt={1}>
                <Text fontSize="xs" color="gray.500">Il y a {maxDisplay} jours</Text>
                <Text fontSize="xs" color="gray.500">Aujourd'hui</Text>
            </Flex>
        </Box>
    );
}

// Full feature streak tracker component that updates from Firestore
export function FullStreakTracker() {
    const [streak, setStreak] = useState({
        currentStreak: 0,
        longestStreak: 0,
        lastUpdated: null as Date | null
    });
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        async function loadStreak() {
            try {
                // Update the streak first (this will increment if appropriate)
                await updateUserStreak();

                // Then fetch the current streak data
                const { streak: userStreak, error } = await fetchUserStreak();

                if (error) {
                    console.error("Failed to load streak data:", error);
                    return;
                }

                setStreak({
                    currentStreak: userStreak.currentStreak,
                    longestStreak: userStreak.longestStreak,
                    lastUpdated: userStreak.lastLoginDate?.toDate() || null
                });

                // Show achievement toast for streak milestones
                if (userStreak.currentStreak === 7 ||
                    userStreak.currentStreak === 30 ||
                    userStreak.currentStreak === 100) {
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
    }, [toast]);

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
                        {streak.currentStreak >= 30 ? '1 mois!' : '1 semaine!'}
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
