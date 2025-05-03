"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Flex,
    Card,
    Heading,
    Text,
    Input,
    Link as ChakraLink,
    Fieldset,
    Button,
    Field,
    FormControl,
    FormErrorMessage,
    Stack,
} from "@chakra-ui/react";
import { FaGoogle } from "react-icons/fa";
import { PasswordInput } from "@/components/ui/password-input";
import { useColorModeValue } from "@/components/ui/color-mode";
import { useAuth } from "@/components/AuthProvider";
import { loginAction, type LoginState } from "./actions";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            colorScheme="blue"
            w="full"
            loading={pending}
            disabled={pending}
        >
            Se connecter
        </Button>
    );
}

export default function Login() {
    const { user, loginWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const from = searchParams.get("from") || "/dashboard";

    const initialState: LoginState = { message: "", errors: {}, fieldValues: { email: "" } };
    const [state, formAction] = useFormState(loginAction, initialState);

    useEffect(() => {
        if (user) {
            router.replace(from);
        }
    }, [user, router, from]);

    const handleGoogleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Erreur lors de la connexion avec Google :", error);
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
                    <form action={formAction}>
                        <Stack gap={4}>
                            <Fieldset.Root>
                                <FormControl isInvalid={!!state.errors?.email} isRequired>
                                    <Field.Root>
                                        <Field.Label>Email</Field.Label>
                                        <Input
                                            type="email"
                                            name="email"
                                            placeholder="exemple@email.com"
                                            defaultValue={state.fieldValues.email}
                                            required
                                        />
                                        {state.errors?.email && (
                                            <FormErrorMessage>{state.errors.email[0]}</FormErrorMessage>
                                        )}
                                    </Field.Root>
                                </FormControl>
                                <FormControl isInvalid={!!state.errors?.password} isRequired>
                                    <Field.Root>
                                        <Field.Label>Mot de passe</Field.Label>
                                        <PasswordInput
                                            name="password"
                                            placeholder="Entrez votre mot de passe"
                                            required
                                        />
                                        {state.errors?.password && (
                                            <FormErrorMessage>{state.errors.password[0]}</FormErrorMessage>
                                        )}
                                    </Field.Root>
                                </FormControl>
                            </Fieldset.Root>

                            <ChakraLink
                                href="/forgot-password"
                                color="blue.500"
                                display="block"
                                textAlign="right"
                                fontSize="sm"
                            >
                                Mot de passe oublié ?
                            </ChakraLink>

                            {state.errors?._form && <Text color="red.500">{state.errors._form[0]}</Text>}

                            <SubmitButton />
                        </Stack>
                    </form>

                    <Button
                        variant="outline"
                        w="full"
                        mt={4}
                        onClick={handleGoogleLogin}
                        leftIcon={<FaGoogle />}
                    >
                        Se connecter avec Google
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
