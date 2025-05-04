"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
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
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { signUpAction, type SignUpState } from "./actions";

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
            S&apos;inscrire
        </Button>
    );
}

export default function Register() {
    const {
        loginWithGoogle,
        user
    } = useAuth();

    const router = useRouter();

    const initialState: SignUpState = { message: "", errors: {}, fieldValues: { email: "" } };
    const [state, formAction] = useFormState(signUpAction, initialState);

    useEffect(() => {
        if (user) {
            router.push("/dashboard");
        }
    }, [user, router]);

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

                                <FormControl isRequired>
                                    <Field.Root required>
                                        <Checkbox name="terms" defaultChecked>
                                            J’ai lu et j’accepte la <Link href="/legal/politique-confidentialite"> Politique de Confidentialité.</Link>
                                        </Checkbox>
                                    </Field.Root>
                                </FormControl>
                            </Fieldset.Root>

                            {state.errors?._form && <Text color="red.500">{state.errors._form[0]}</Text>}

                            <SubmitButton />
                        </Stack>
                    </form>

                    <Button
                        variant="outline"
                        w="full"
                        mt={4}
                        onClick={handleGoogleSignUp}
                        leftIcon={<FaGoogle />}
                    >
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
