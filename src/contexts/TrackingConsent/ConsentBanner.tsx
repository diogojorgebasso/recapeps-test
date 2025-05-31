'use client';

import { useContext } from 'react';
import {
    Box,
    Text,
    Button,
    HStack,
    VStack,
    Link
} from '@chakra-ui/react';
import { TrackingConsentContext } from '@/contexts/TrackingConsent/TrackingConsentProvider';

export function ConsentBanner() {
    const context = useContext(TrackingConsentContext);

    if (!context) {
        throw new Error('CookieConsentBanner must be used within TrackingConsentProvider');
    }

    const { consentGiven, setConsent } = context;

    // Don't show banner if consent has already been given or denied
    if (consentGiven !== null) {
        return null;
    }

    return (
        <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg="white"
            borderTop="1px solid"
            borderColor="gray.200"
            p={4}
            shadow="lg"
            zIndex={1000}
        >
            <VStack gap={3} maxW="container.lg" mx="auto">
                <Text fontSize="sm" textAlign="center">
                    Nous utilisons des cookies pour améliorer votre expérience et analyser l&apos;utilisation de notre site.
                    En continuant, vous acceptez notre{' '}
                    <Link href="/legal/politique-confidentialite" color="blue.500" textDecoration="underline">
                        politique de confidentialité
                    </Link>.
                </Text>

                <HStack gap={3}>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConsent(false)}
                    >
                        Refuser
                    </Button>
                    <Button
                        size="sm"
                        colorPalette="blue"
                        onClick={() => setConsent(true)}
                    >
                        Accepter
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
}