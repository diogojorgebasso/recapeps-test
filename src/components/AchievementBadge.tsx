import { Box, Text, VStack, Icon, Tooltip } from '@chakra-ui/react';
import { FaTrophy, FaMedal, FaStar, FaFire } from 'react-icons/fa';

type AchievementType = 'trophy' | 'medal' | 'star' | 'streak';

interface AchievementBadgeProps {
    type: AchievementType;
    label: string;
    description: string;
    isUnlocked: boolean;
}

export default function AchievementBadge({ type, label, description, isUnlocked }: AchievementBadgeProps) {
    const getIcon = () => {
        switch (type) {
            case 'trophy': return FaTrophy;
            case 'medal': return FaMedal;
            case 'star': return FaStar;
            case 'streak': return FaFire;
        }
    };

    const getColor = () => {
        if (!isUnlocked) return 'gray.400';

        switch (type) {
            case 'trophy': return 'gold';
            case 'medal': return 'blue.500';
            case 'star': return 'purple.500';
            case 'streak': return 'orange.500';
        }
    };

    return (
        <Tooltip label={description}>
            <VStack
                gap={1}
                opacity={isUnlocked ? 1 : 0.6}
                transition="all 0.2s"
                cursor="pointer"
                _hover={{ transform: 'translateY(-2px)' }}
            >
                <Box
                    bg={isUnlocked ? 'white' : 'gray.100'}
                    borderRadius="full"
                    p={2}
                    boxShadow={isUnlocked ? 'md' : 'none'}
                >
                    <Icon as={getIcon()} boxSize="24px" color={getColor()} />
                </Box>
                <Text fontSize="xs" fontWeight="medium" textAlign="center">
                    {label}
                </Text>
            </VStack>
        </Tooltip>
    );
}
