'use client';

import { auth } from '@/lib/firebaseClient';
import { useState } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { VStack, Heading, Text, Button, Spinner } from '@chakra-ui/react'; // Import Chakra components
import { checkEmailVerified } from './actions'; // Import the server action

export default function VerifyEmailPage() {
    const [sentAgain, setSentAgain] = useState(false);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null); // Optional: add error state

    // Updated handler to call the server action
    async function handleCheckVerified() {
        if (!auth.currentUser) return;
        setChecking(true);
        setError(null); // Reset error on new check

        try {
            // Optional: Reload client state first, though server check is primary
            // await auth.currentUser.reload();
            // const isClientVerified = auth.currentUser.emailVerified;
            // if (isClientVerified) {
            //     router.replace('/');
            //     return;
            // }

            // Call the server action to check verification status
            const isServerVerified = await checkEmailVerified(auth.currentUser.uid);

            if (isServerVerified) {
                // Optional: Force refresh client state if needed after server confirmation
                await auth.currentUser.reload();
                router.replace('/'); // ✅ Rediriger
            } else {
                // Optional: Inform user if server says still not verified
                setError("L'adresse e-mail n'est pas encore vérifiée. Veuillez vérifier votre boîte de réception ou réessayer.");
                // Consider reloading client state here too in case of race conditions
                // await auth.currentUser.reload();
            }
        } catch (err) {
            console.error("Verification check failed:", err);
            setError("Une erreur s'est produite lors de la vérification.");
        } finally {
            setChecking(false);
        }
    }

    async function handleResendEmail() {
        if (auth.currentUser) {
            try {
                await sendEmailVerification(auth.currentUser);
                setSentAgain(true);
                setError(null); // Clear error if resend succeeds
            } catch (err) {
                console.error("Failed to resend email:", err);
                setError("Échec de l'envoi de l'e-mail.");
            }
        }
    }

    return (
        <VStack as="main" gap={4} p={8} textAlign="center" align="center">
            <Heading as="h1" size="lg" fontWeight="bold">
                Vérifiez votre adresse e-mail
            </Heading>
            <Text>
                Nous venons d'envoyer un lien à <strong>{auth.currentUser?.email}</strong>. <br />
                Cliquez dessus, puis revenez et appuyez sur le bouton ci-dessous.
            </Text>

            {error && <Text color="red.500">{error}</Text>}

            <Button
                onClick={handleCheckVerified}
                colorScheme="blue"
                isLoading={checking}
                spinner={<Spinner size="sm" />}
                loadingText="Vérification…"
            >
                J'ai vérifié mon adresse
            </Button>

            <Button
                variant="link"
                isDisabled={sentAgain}
                onClick={handleResendEmail}
                size="sm"
                mt={2}
            >
                {sentAgain ? 'Lien renvoyé !' : 'Renvoyer l\'e-mail'}
            </Button>
        </VStack>
    );
}
