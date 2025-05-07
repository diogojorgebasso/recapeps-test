"use client";

import { useActionState } from 'react'
import Link from 'next/link';
import { useState } from 'react';

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
import { signInWithGoogle } from "@/lib/firebase/auth";

export default function Page() {
    const [state, action, pending] = useActionState(login, undefined);

    const handleGoogleLogin = (event) => {
        event.preventDefault();
        signInWithGoogle();
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
                                <Field.Root>
                                    <Field.Label>Email</Field.Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder="exemple@email.com"
                                        required
                                    />
                                    {state?.errors && "email" in state.errors && Array.isArray(state.errors.email) && (
                                        <Field.ErrorText>{state.errors.email[0]}</Field.ErrorText>
                                    )}
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Mot de passe</Field.Label>
                                    <PasswordInput
                                        name="password"
                                        placeholder="Entrez votre mot de passe"
                                        required
                                    />
                                    {state?.errors && "password" in state.errors && state.errors.password && (
                                        <Fieldset.ErrorText>{state.errors.password[0]}</Fieldset.ErrorText>
                                    )}
                                </Field.Root>
                            </Fieldset.Root>

                            <Link
                                href="/forgot-password"
                                color="blue.500"
                            >
                                Mot de passe oublié ?
                            </Link>


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
                    >
                        <FaGoogle />
                        Se connecter avec Google
                    </Button>

                    <Text mt={4} fontSize="sm" textAlign="center">
                        Vous n&apos;avez pas de compte ?{" "}
                        <Link
                            href="/register"
                            color="blue.500"
                        >
                            Inscrivez-vous
                        </Link>
                    </Text>
                </Card.Body>
            </Card.Root>
        </Flex>
    );
}
