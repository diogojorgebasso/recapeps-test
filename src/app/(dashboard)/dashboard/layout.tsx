'use client';

import { useEffect } from 'react';
import { Box, Flex, Container } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Header } from '@/components/Header';
import { PathProgress } from '@/components/PathProgress';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, loading } = useAuth();
    const { isLoading: isSubscriptionLoading } = useSubscription();
    const pathname = usePathname();

    // Show progress indicator for certain paths
    const showProgress = pathname.includes('/quiz') ||
        pathname.includes('/flashcards') ||
        pathname.includes('/notes');

    if (loading || isSubscriptionLoading) {
        return (
            <Flex justify="center" align="center" height="100vh">
                <Box>Chargement...</Box>
            </Flex>
        );
    }

    return (
        <Box>
            <Header />

            {showProgress && (
                <Box py={4} bg="gray.50">
                    <Container maxW="container.xl">
                        <PathProgress currentPath={pathname} />
                    </Container>
                </Box>
            )}

            <Container maxW="container.xl" pt={6} pb={12}>
                {children}
            </Container>
        </Box>
    );
}