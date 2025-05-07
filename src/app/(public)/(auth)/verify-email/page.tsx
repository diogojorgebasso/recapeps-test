"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, User as FirebaseUser } from "firebase/auth"; // Import User as FirebaseUser
import { auth } from "@/lib/firebase/clientApp";
import {
    Box,
    Button,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Alert,
    AlertTitle,
    AlertDescription,
    Spinner,
    List,
} from "@chakra-ui/react";

export default function VerifyEmail() {
    const [user, setUser] = useState<FirebaseUser | null>(null); // Typed user state
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setLoading(false);

            if (!currentUser) {
                router.push('/');
                return;
            }

            if (currentUser.emailVerified) {
                router.push('/');
                return;
            }

            setUser(currentUser);
        });

        return () => unsubscribe();
    }, [router]);

    const handleSendVerificationEmail = async () => {
        if (!user) return;
        setIsSending(true);
        setMessage('');
        try {
            await sendEmailVerification(user);
            setMessage('Verification email sent! Please check your inbox.'); // Keep for non-toast display if needed
        } catch (error: any) {
            setMessage(`Error sending verification email: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const checkVerificationStatus = async () => {
        if (!user) return;
        setIsChecking(true);
        setMessage('');
        try {
            await user.reload();
            // It's important to get the fresh user instance from auth.currentUser
            const refreshedUser = auth.currentUser;

            if (refreshedUser && refreshedUser.emailVerified) {
                setMessage('Email verified successfully! Redirecting...');
                setTimeout(() => router.push('/'), 1500);
            } else {
                setMessage('Email not verified yet. Please check your inbox and click the verification link.');
            }
        } catch (error: any) {
            setMessage(`Error checking verification status: ${error.message}`);
        } finally {
            setIsChecking(false);
        }
    };

    if (loading) {
        return (
            <Container centerContent py={10}>
                <Spinner size="xl" />
                <Text mt={4}>Loading...</Text>
            </Container>
        );
    }

    if (!user) {
        // This case should ideally be handled by the redirect in useEffect,
        // but as a fallback or if loading is very fast:
        return (
            <Container centerContent py={10}>
                <Text>Redirecting...</Text>
            </Container>
        );
    }

    return (
        <Container maxW="container.md" py={10} textAlign="center">
            <VStack gap={6} align="stretch">
                <Heading as="h1" size="xl">
                    Email Verification Required
                </Heading>
                <Text>
                    Your email address needs to be verified before you can fully access our services.
                </Text>
                <Text>
                    A verification email has been sent to: <Text as="strong">{user.email}</Text>
                </Text>

                <HStack gap={4} justifyContent="center" my={8}>
                    <Button
                        onClick={handleSendVerificationEmail}
                        colorScheme="blue"
                        loading={isSending}
                        loadingText="Sending..."
                    >
                        Resend Verification Email
                    </Button>
                    <Button
                        onClick={checkVerificationStatus}
                        colorScheme="green"
                        loading={isChecking}
                        loadingText="Checking..."
                    >
                        I&apos;ve Verified My Email
                    </Button>
                </HStack>

                {message && (
                    <Alert.Root status={message.toLowerCase().includes('error') ? 'error' : 'info'} borderRadius="md">
                        <Alert.Indicator />
                        <Box flex="1">
                            <AlertTitle>
                                {message.toLowerCase().includes('error') ? 'Error!' : 'Notification'}
                            </AlertTitle>
                            <AlertDescription display="block">
                                {message}
                            </AlertDescription>
                        </Box>
                    </Alert.Root>
                )}

                <Box textAlign="left" p={4} borderWidth="1px" borderRadius="md">
                    <Heading as="h2" size="md" mb={3}>
                        Instructions:
                    </Heading>
                    <List.Root gap={2}>
                        <List.Item>Check your email inbox (and spam folder) for a verification link from us.</List.Item>
                        <List.Item>Click on the verification link in the email.</List.Item>
                        <List.Item>After verifying, return here and click the &rdquo;I've Verified My Email" button above.</List.Item>
                        <List.Item>If you don&apos;t receive an email or the link has expired, click "Resend Verification Email".</List.Item>
                    </List.Root>
                </Box>
            </VStack>
        </Container>
    );
}