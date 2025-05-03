"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
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
import { useColorModeValue } from "@/components/ui/color-mode";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

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
            Envoyer l'email de réinitialisation
        </Button>
    );
}

export default function ForgotPassword() {
    const router = useRouter();

    const initialState: ForgotPasswordState = { message: "", errors: {}, fieldValues: { email: "" }, success: false };
    const [state, formAction] = useFormState(forgotPasswordAction, initialState);

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
                        {state.success
                            ? "Un email de réinitialisation a été envoyé."
                            : "Entrez votre email pour réinitialiser votre mot de passe"
                        }
                    </Text>
                </Card.Header>

                <Card.Body>
                    {!state.success ? (
                        <form action={formAction}>
                            <Stack gap={4}>
                                <Fieldset.Root>
                                    <FormControl isInvalid={!!state.errors?.email} isRequired>
                                        <Field.Root required>
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
                                </Fieldset.Root>

                                {state.errors?._form && <Text color="red.500">{state.errors._form[0]}</Text>}

                                <SubmitButton />
                            </Stack>
                        </form>
                    ) : (
                        <Button
                            colorScheme="green"
                            w="full"
                            mt={4}
                            onClick={() => router.push("/login")}
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
