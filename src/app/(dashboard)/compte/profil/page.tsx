'use client';

import { Box, Flex, Heading, VStack } from '@chakra-ui/react';
import { useAuth } from '@/contexts/Auth/useAuth';
import ProfilePhotoUploader from './components/ProfilePhotoUploader';
import ProfileDetailsForm from './components/ProfileDetailsForm';
import SubscriptionSection from './components/SubscriptionSection';
import EmailNotificationToggle from './components/EmailNotificationToggle';
import { Toaster } from '@/components/ui/toaster';

export default function ProfilePage() {
    const { user, pro } = useAuth();

    if (!user) return null; // or a skeleton

    return (
        <Box p={6}>
            <Toaster />
            <Heading size="lg" mb={6}>
                Ton profil
            </Heading>

            <Flex gap={10} align="flex-start">
                <VStack gap={4}>
                    <ProfilePhotoUploader />
                </VStack>

                <ProfileDetailsForm
                    defaultFirst={user.displayName?.split(' ')[0] ?? ''}
                    defaultLast={user.displayName?.split(' ').slice(1).join(' ') ?? ''}
                    defaultEmail={user.email ?? ''}
                />
            </Flex>

            <Box mt={8}>
                <Heading as="h3" size="md" mb={4}>
                    Préférences Email
                </Heading>
                <EmailNotificationToggle />
            </Box>

            <Box mt={8}>
                <SubscriptionSection pro={pro} />
            </Box>
        </Box>
    );
}
