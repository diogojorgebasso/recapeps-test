"use client";

import { useActionState } from 'react'

import {
    Flex,
    Card,
    Heading,
    Text,
    Input,
    Fieldset,
    Button,
    Field,
    Stack,
} from "@chakra-ui/react";
import { FaGoogle } from "react-icons/fa";
import { PasswordInput } from "@/components/ui/password-input";
import { useColorModeValue } from "@/components/ui/color-mode";
import { login } from "./actions";

export default async function Page() {
    const [state, action, pending] = useActionState(login, undefined)

    const { user, loginWithGoogle } = useAuth();

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
                    <form action={action}>
                        <Stack gap={4}>
                            <Fieldset.Root>
                                <FormControl >
                                    <Field.Root>
                                        <Field.Label>Email</Field.Label>
                                        <Input
                                            type="email"
                                            name="email"
                                            placeholder="exemple@email.com"
                                            required
                                        />
                                        {state.errors?.email && (
                                            <FormErrorMessage>{state.errors.email[0]}</FormErrorMessage>
                                        )}
                                    </Field.Root>
                                </FormControl>
                                <FormControl>
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

                            <Button
                                type="submit"
                                colorScheme="blue"
                                w="full"
                                loading={pending}
                                disabled={pending}
                            >
                                Se connecter
                            </Button>
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
