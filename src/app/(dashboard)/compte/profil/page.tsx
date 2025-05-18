'use client';

import { Box, Flex, Heading, VStack, Spinner, Alert, Center, Text } from '@chakra-ui/react'; // Added Center, Text
import ProfilePhotoUploader from './components/ProfilePhotoUploader';
import ProfileDetailsForm from './components/ProfileDetailsForm';
import SubscriptionSection from './components/SubscriptionSection';
import EmailNotificationToggle from './components/EmailNotificationToggle';
// Removed useEffect and useState for error as user state will handle this
import { useUserWithClaims } from '@/lib/getUser';

export default function ProfilePage() {
    const { user, pro } = useUserWithClaims();


    // Handle loading state: user is undefined while onAuthStateChanged is resolving
    if (user === undefined) {
        return (
            <Center h="calc(100vh - 200px)"> {/* Adjust height as needed */}
                <Spinner />
            </Center>
        );
    }

    // Handle not authenticated state: user is null after onAuthStateChanged resolved
    if (user === null) {
        return (
            <Box p={6} display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)">
                <Alert.Root status="warning" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="md" p={6}>
                    <Alert.Indicator boxSize="40px" mr={0} mb={3} />
                    <Heading size="md" mb={2}>Accès non autorisé</Heading>
                    <Text>Veuillez vous connecter pour accéder à votre profil.</Text>
                </Alert.Root>
            </Box>
        );
    }

    // At this point, user is a valid User object
    return (
        <Box p={6}>
            <Heading size="lg" mb={6}>
                Mon profil
            </Heading>

            <Flex gap={10} align="flex-start" direction={{ base: "column", md: "row" }}>
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
                    Préférences email
                </Heading>
                <EmailNotificationToggle />
            </Box>

            <Box mt={8}>
                <SubscriptionSection pro={pro} />
            </Box>
        </Box>
    );
}
