"use client";

import { useState } from 'react';
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
    Checkbox,
} from "@chakra-ui/react";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import { PasswordInput } from "@/components/ui/password-input";
import { registerWithEmailAndPassword, signUpWithGoogle } from "@/lib/firebase/auth";
import { z, ZodError } from "zod/v4";
import { useRouter } from 'next/navigation'
import { FirebaseError } from 'firebase/app';

// Schéma de validation
const registerSchema = z.object({
    name: z.string().optional(),
    email: z.email({ error: "L'email doit être valide" }).toLowerCase(),
    password: z.string()
        .min(6, { error: "Le mot de passe doit contenir au moins 6 caractères" })
        .regex(/[A-Z]/, { error: "Le mot de passe doit contenir au moins une lettre majuscule" })
        .regex(/[0-9]/, { error: "Le mot de passe doit contenir au moins un chiffre" }),
    acceptTerms: z.boolean()
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState<RegisterFormData>({
        name: "",
        email: "",
        password: "",
        acceptTerms: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<string>();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const hangleSignUpWithGoogle = async (event: React.FormEvent) => {
        event.preventDefault();
        signUpWithGoogle();
        router.push("/parcours/dashboard"); // we assume the email is verified.
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const validated = registerSchema.parse(formData);
            setIsLoading(true);
            await registerWithEmailAndPassword(
                validated.email,
                validated.password,
                validated.name ?? undefined);
            console.log("IM GOING TO redirect the user");
            setIsLoading(false);
            router.replace("/verify-email");
            console.log("in theory I redirected the user");
        } catch (err) {
            setIsLoading(false);
            if (err instanceof ZodError) {
                const pretty = z.prettifyError(err);
                setErrors(pretty)
                return;
            }
            if (err instanceof FirebaseError) {
                switch (err.code) {
                    case "auth/email-already-in-use":
                        setErrors("Adresse déjà utilisée");
                        break;
                    case "auth/weak-password":
                        setErrors("Mot de passe trop faible");
                        break;
                    default:
                        setErrors("Internal server error.");
                        break;
                }
            }
        }
    };

    return (
        <Flex
            alignItems="center"
            justifyContent="center"
            p={4}
        >
            <Card.Root width="sm" shadow="md">
                <Card.Header textAlign="center">
                    <Heading size="lg">Inscription</Heading>
                    <Text mt={2} fontSize="sm" color="gray.600">
                        Veuillez compléter les informations ci-dessous pour créer votre compte.
                    </Text>
                </Card.Header>

                <Card.Body>
                    <form onSubmit={handleSubmit}>
                        <Stack gap={4}>
                            <Fieldset.Root>
                                <Field.Root>
                                    <Field.Label>Ton nom :</Field.Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={formData.name ?? ""}
                                        onChange={handleChange}
                                        autoComplete='name'
                                    />
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Email
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="exemple@email.com"
                                        autoComplete='email'
                                    />
                                </Field.Root>

                                {/* Mot de passe */}
                                <Field.Root required>
                                    <Field.Label>Mot de passe
                                        <Field.RequiredIndicator />
                                    </Field.Label>
                                    <PasswordInput
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Entrez votre mot de passe"
                                        autoComplete="new-password"
                                    />
                                </Field.Root>
                                <Field.Root required>
                                    <Checkbox.Root
                                        name="acceptTerms"
                                        onCheckedChange={(checked) =>
                                            setFormData(prev => ({
                                                ...prev,
                                                acceptTerms: typeof checked === 'boolean' ? checked : false
                                            }))
                                        }
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label>J&apos;ai lu et j&apos;accepte la <Link href="/legal/politique-confidentialite">Politique de Confidentialité</Link></Checkbox.Label>
                                    </Checkbox.Root>
                                </Field.Root>
                            </Fieldset.Root>
                            {errors && (
                                <Text color="red.500" fontSize="sm">
                                    {errors}
                                </Text>
                            )}
                            <Button
                                type="submit"
                                colorPalette="blue"
                                w="full"
                                loading={isLoading}
                                disabled={isLoading}>
                                Créer un compte
                            </Button>
                        </Stack>
                    </form>

                    <HStack>
                        <Separator flex="1" />
                        <Text flexShrink="0">ou</Text>
                        <Separator flex="1" />
                    </HStack>

                    <Button variant="outline" w="full" mt={4} onClick={hangleSignUpWithGoogle} disabled={isLoading}>
                        <FaGoogle />
                        <Text ml={2}>S&apos;inscrire avec Google</Text>
                    </Button>

                    <Text mt={4} fontSize="sm" textAlign="center">
                        Vous avez déjà un compte ? {" "}
                        <Link href="/login">Connectez-vous</Link>
                    </Text>
                </Card.Body>
            </Card.Root>
        </Flex>
    );
}
