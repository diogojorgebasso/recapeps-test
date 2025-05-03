import { useState } from "react";
import {
    Flex,
    Card,
    Heading,
    Text,
    Input,
    Link as ChakraLink,
    Fieldset,
} from "@chakra-ui/react";
import { useNavigate } from "react-router";
import { useColorModeValue } from "@/components/ui/color-mode";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);

    const navigate = useNavigate();

    const handleResetPassword = async () => {
        setError(null);

        if (!email) {
            setError("Veuillez entrer votre email.");
            return;
        }

        setIsSubmitting(true);

        try {
            await resetPassword(email);
            setIsEmailSent(true);
        } catch (error) {
            setError("Une erreur s'est produite. Vérifiez que l'email est correct.");
            console.error("Erreur lors de la réinitialisation du mot de passe :", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Flex
            height="100vh"
            alignItems="center"
            justifyContent="center"
            bg={useColorModeValue("gray.50", "gray.800")}
            p={4}
        >
            <Card.Root width="sm" shadow="md">
                <Card.Header textAlign="center">
                    <Heading as="h2" size="lg">
                        Réinitialisation du mot de passe
                    </Heading>
                    <Text mt={2} fontSize="sm" color="gray.600">
                        {isEmailSent
                            ? "Un email de réinitialisation a été envoyé."
                            : "Entrez votre email pour réinitialiser votre mot de passe"
                        }
                    </Text>
                </Card.Header>

                <Card.Body>
                    {!isEmailSent ? (
                        <>
                            <Fieldset.Root>
                                <Field.Root required>
                                    <Field.Label>Email</Field.Label>
                                    <Input
                                        type="email"
                                        placeholder="exemple@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Field.Root>
                            </Fieldset.Root>

                            {error && <Text color="red.500" mt={4}>{error}</Text>}

                            <Button
                                colorPalette="blue"
                                w="full"
                                mt={4}
                                onClick={handleResetPassword}
                                loading={isSubmitting}
                            >
                                Envoyer l'email de réinitialisation
                            </Button>
                        </>
                    ) : (
                        <Button
                            colorPalette="green"
                            w="full"
                            mt={4}
                            onClick={() => navigate("/login")}
                        >
                            Retour à la page de connexion
                        </Button>
                    )}

                    <Text mt={4} fontSize="sm" textAlign="center">
                        Vous vous souvenez de votre mot de passe ?{" "}
                        <ChakraLink
                            href="/login"
                            color="blue.500"
                        >
                            Connectez-vous
                        </ChakraLink>
                    </Text>
                </Card.Body>
            </Card.Root>
        </Flex>
    );
}
