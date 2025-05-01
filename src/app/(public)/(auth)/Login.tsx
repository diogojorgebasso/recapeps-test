import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
    Flex,
    Card,
    Heading,
    Text,
    Input,
    Link as ChakraLink,
    Fieldset,
    Button,
    Field
} from "@chakra-ui/react";
import { FaGoogle } from "react-icons/fa";
import { PasswordInput } from "@/components/ui/password-input";
import { useColorModeValue } from "@/components/ui/color-mode";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Get the redirect URL from location state or default to dashboard
    const from = location.state?.from?.pathname || "/dashboard";

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleLogin = async () => {
        setError(null);
        setIsSubmitting(true);
        try {
            await simpleLogin(email, password);
            navigate(from, { replace: true });
        } catch (error) {
            setError("Identifiants incorrects. Veuillez réessayer.");
            console.error("Erreur lors de la connexion :", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
            navigate(from, { replace: true });
        } catch (error) {
            setError("Erreur lors de la connexion avec Google. Veuillez réessayer.");
            console.error("Erreur lors de la connexion avec Google :", error);
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
                        Connexion
                    </Heading>
                    <Text mt={2} fontSize="sm" color="gray.600">
                        Entrez vos identifiants pour vous connecter
                    </Text>
                </Card.Header>

                <Card.Body>
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
                        <PasswordInput
                            placeholder="Entrez votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Fieldset.Root>

                    <ChakraLink
                        href="/forgot-password"
                        color="blue.500"
                        display="block"
                        mt={2}
                        textAlign="right"
                        fontSize="sm"
                    >
                        Mot de passe oublié ?
                    </ChakraLink>

                    {error && <Text color="red.500" mt={4}>{error}</Text>}

                    <Button
                        colorPalette="blue"
                        w="full"
                        mt={4}
                        onClick={handleLogin}
                        loading={isSubmitting}
                    >
                        Se connecter
                    </Button>

                    <Button
                        variant="outline"
                        w="full"
                        mt={4}
                        onClick={handleGoogleLogin}
                    >
                        <FaGoogle mr={2} /> Se connecter avec Google
                    </Button>

                    <Text mt={4} fontSize="sm" textAlign="center">
                        Vous n'avez pas de compte ?{" "}
                        <ChakraLink
                            href="/register"
                            color="blue.500"
                        >
                            Inscrivez-vous
                        </ChakraLink>
                    </Text>
                </Card.Body>
            </Card.Root>
        </Flex>
    );
}
