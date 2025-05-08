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
    HStack,
    Separator,
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import { useColorModeValue } from "@/components/ui/color-mode";
import { PasswordInput } from "@/components/ui/password-input";
import { register } from "./actions";
import { signUpWithGoogle } from "@/lib/firebase/auth"; // Updated import
import { useActionState } from "react";

export default function Register() {

    const [state, action, pending] = useActionState(register, undefined)

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
                                    {state?.errors && 'password' in state.errors && Array.isArray(state.errors.password) &&
                                        state.errors.password.map((error: string) => (
                                            <Field.ErrorText key={error}>- {error}</Field.ErrorText>
                                        ))
                                    }
                                </Field.Root>

                                <Field.Root required>
                                    <Checkbox>J&apos;ai lu et j&apos;accept la<Link href="/legal/politique-confidentialite">Politique de Confidentialité</Link></Checkbox>
                                </Field.Root>
                            </Fieldset.Root>


                            <Button
                                type="submit"
                                colorPalette="blue"
                                w="full"
                                loading={pending}
                                disabled={pending}
                            >
                                S&apos;inscrire
                            </Button>
                        </Stack>
                    </form>

                    <HStack>
                        <Separator flex="1" />
                        <Text flexShrink="0">ou</Text>
                        <Separator flex="1" />
                    </HStack>

                    <Button
                        variant="outline"
                        w="full"
                        mt={4}
                        onClick={() => signUpWithGoogle()}
                    >
                        <FaGoogle />
                        S&apos;inscrire avec Google
                    </Button>

                    <Text mt={4} fontSize="sm" textAlign="center">
                        Vous avez déjà un compte ?
                        <Link href="/login">
                            Connectez-vous
                        </Link>
                    </Text>
                </Card.Body>
            </Card.Root>
        </Flex >
    );
}
