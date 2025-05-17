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
    Checkbox
} from "@chakra-ui/react";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import { useColorModeValue } from "@/components/ui/color-mode";
import { PasswordInput } from "@/components/ui/password-input";
import { registerWithEmailAndPassword, signUpWithGoogle } from "@/lib/firebase/auth";
import { z } from "zod";
import { useRouter } from 'next/navigation'

// Schéma de validation
const registerSchema = z.object({
    name: z.string().nullable().optional(),
    email: z.string().email("Adresse email invalide"),
    password: z.string()
        .min(8, "Le mot de passe doit contenir au moins 8 caractères")
        .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule")
        .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule")
        .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState<RegisterFormData>({
        name: "",
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));

        if (errors[name]) {
            setErrors(prev => {
                const cp = { ...prev };
                delete cp[name];
                return cp;
            });
        }
    };

    const hangleSignUpWithGoogle = async (event: React.FormEvent) => {
        event.preventDefault();
        signUpWithGoogle();
        router.push("/parcours/dashboard"); // we assume the email is verified.
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);
        setErrors({});

        try {
            const validated = registerSchema.parse(formData);
            setIsLoading(true);
            await registerWithEmailAndPassword(validated.email, validated.password, validated.name ?? undefined);
            router.push("/verify-email");
        } catch (err) {
            if (err instanceof z.ZodError) {
                const fieldErrs: Record<string, string[]> = {};
                err.errors.forEach(issue => {
                    const key = issue.path[0] as string;
                    (fieldErrs[key] ||= []).push(issue.message);
                });
                setErrors(fieldErrs);
            } else {
                setGeneralError("Échec de l'inscription. Veuillez réessayer.");
                console.error(err);
            }
        } finally {
            setIsLoading(false);
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
                                    {errors.name?.map((e, i) => (
                                        <Field.ErrorText key={i}>{e}</Field.ErrorText>
                                    ))}
                                </Field.Root>

                                <Field.Root required>
                                    <Field.Label>Email</Field.Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="exemple@email.com"
                                        autoComplete='email'
                                    />
                                    {errors.email?.map((e, i) => (
                                        <Field.ErrorText key={i}>{e}</Field.ErrorText>
                                    ))}
                                </Field.Root>

                                {/* Mot de passe */}
                                <Field.Root required>
                                    <Field.Label>Mot de passe</Field.Label>
                                    <PasswordInput
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Entrez votre mot de passe"
                                        autoCapitalize="new-password"
                                    />
                                    {errors.password?.map((e, i) => (
                                        <Field.ErrorText key={i}>{e}</Field.ErrorText>
                                    ))}
                                </Field.Root>
                                <Field.Root required>
                                    <Checkbox.Root
                                        name="acceptTerms">
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label>J&apos;ai lu et j&apos;accepte la <Link href="/legal/politique-confidentialite">Politique de Confidentialité</Link></Checkbox.Label>
                                    </Checkbox.Root>
                                    {errors.acceptTerms?.map((e, i) => (
                                        <Field.ErrorText key={i}>{e}</Field.ErrorText>
                                    ))}
                                </Field.Root>
                            </Fieldset.Root>

                            {generalError && (
                                <Text color="red.500" fontSize="sm">{generalError}</Text>
                            )}

                            <Button type="submit"
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
