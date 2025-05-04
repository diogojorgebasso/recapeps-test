"use client";

import {
    Flex,
    Card,
    Heading,
    Text,
    Stack,
    Input,
    Fieldset,
    Field,
    Button,
    Checkbox,
} from "@chakra-ui/react";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import { useColorModeValue } from "@/components/ui/color-mode";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/auth/AuthContext";
import { register } from "./actions";

export default function Register() {
    const {
        loginWithGoogle,
    } = useAuth();

    const [state, action, pending] = useActionState(register, undefined)

    const handleGoogleSignUp = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Erreur lors de la connexion avec Google :", (error as Error).message);
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
                        Inscription
                    </Heading>
                    <Text mt={2} fontSize="sm" color="gray.600">
                        Créez un compte en remplissant les informations ci-dessous.
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
                                        defaultValue={state.fieldValues.email}
                                        required
                                    />
                                    {state?.errors?.email && (
                                        <Field.ErrorText>{state?.errors.email[0]}</Field.ErrorText>
                                    )}
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label>Mot de passe</Field.Label>
                                    <PasswordInput
                                        name="password"
                                        placeholder="Entrez votre mot de passe"
                                        required
                                    />
                                    {state.errors?.password && (
                                        <Field.ErrorText>{state.errors.password[0]}</Field.ErrorText>
                                    )}
                                </Field.Root>

                                <Field.Root required>
                                    <Checkbox.Root defaultChecked>
                                        <Checkbox.Indicator />
                                        <Checkbox.Label>J’ai lu et j’accepte la <Link href="/legal/politique-confidentialite"> Politique de Confidentialité.</Link></Checkbox.Label>
                                    </Checkbox.Root>
                                </Field.Root>
                            </Fieldset.Root>

                            {state.errors?._form && <Text color="red.500">{state.errors._form[0]}</Text>}

                            <Button
                                type="submit"
                                colorScheme="blue"
                                w="full"
                                loading={pending}
                                disabled={pending}
                            >
                                S&apos;inscrire
                            </Button>
                        </Stack>
                    </form>

                    <Button
                        variant="outline"
                        w="full"
                        mt={4}
                        onClick={handleGoogleSignUp}
                    >
                        <FaGoogle />
                        S&apos;inscrire avec Google
                    </Button>

                    <Text mt={4} fontSize="sm" textAlign="center">
                        Vous avez déjà un compte ?{" "}
                        <Link href="/login">
                            Connectez-vous
                        </Link>
                    </Text>
                </Card.Body>
            </Card.Root>
        </Flex>
    );
}
