"use client";

import { useActionState } from 'react'
import {
    Flex,
    Heading,
    Text,
    Input,
    Fieldset,
    Button,
    Field,
    Stack,
} from "@chakra-ui/react";
import Link from 'next/link';
import { forgotPasswordAction } from "./actions";

export default function ForgotPassword() {

    const [state, action, pending] = useActionState(forgotPasswordAction, undefined)

    return (
        <Flex
            height="100vh"
            alignItems="center"
            justifyContent="center"
            p={4}
        >
            <Heading as="h2" size="lg">
                Réinitialisation du mot de passe
            </Heading>

            <Text mt={2} fontSize="sm" color="gray.600">
                {state?.success
                    ? "Un email de réinitialisation a été envoyé."
                    : "Entrez votre email pour réinitialiser votre mot de passe"
                }
            </Text>

            <form action={action}>
                <Stack gap={4}>
                    <Fieldset.Root>
                        <Field.Root required>
                            <Field.Label>Email</Field.Label>
                            <Input
                                type="email"
                                name="email"
                                placeholder="exemple@email.com"
                                required
                            />
                            {state?.errors?.email && (
                                <Field.ErrorText>{state.errors.email[0]}</Field.ErrorText>
                            )}
                        </Field.Root>
                    </Fieldset.Root>

                    <Button
                        type="submit"
                        colorPalette="blue"
                        w="full"
                        loading={pending}
                        disabled={pending}
                    >
                        Envoyer l&lsquo;email de réinitialisation
                    </Button>
                </Stack>
            </form>


            <Text mt={4} fontSize="sm" textAlign="center">
                Vous vous souvenez de votre mot de passe ?{" "}
                <Link
                    href="/login"
                    color="blue.500"
                >
                    Connectez-vous
                </Link>
            </Text>
        </Flex >
    );
}
