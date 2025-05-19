'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Input,
    Textarea,
    Text,
    Fieldset,
    VStack,
    Field,
} from "@chakra-ui/react";
import { z } from "zod";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { useUserWithClaims } from '@/lib/getUser';
import { toaster, Toaster } from "@/components/ui/toaster";

// Define validation schema
const contactSchema = z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Adresse email invalide"),
    message: z.string()
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Page() {
    const { user } = useUserWithClaims();
    const [formData, setFormData] = useState<ContactFormData>({
        name: '',
        email: '',
        message: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.displayName || '',
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when user changes it
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        try {
            const validatedData = contactSchema.parse(formData);
            setIsLoading(true);

            // Add data to Firestore contacts collection
            const contactData = {
                ...validatedData,
                userId: user?.uid || null,
                createdAt: new Date()
            };

            await addDoc(collection(db, 'contacts'), contactData);

            // Reset form and show success message
            setFormData({
                name: user?.displayName || '',
                email: user?.email || '',
                message: ''
            });

            toaster.create({
                type: 'success',
                title: 'Message envoyé',
                description: 'Votre message a été envoyé avec succès!'
            })
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Format Zod errors
                const fieldErrors: Record<string, string> = {};
                error.errors.forEach(err => {
                    const path = err.path[0] as string;
                    fieldErrors[path] = err.message;
                });
                setErrors(fieldErrors);
                toaster.create({
                    type: 'warning',
                    title: 'Erreur de validation',
                    description: 'Veuillez corriger les erreurs indiquées dans le formulaire.'
                });
            } else {
                console.error("Error submitting contact form:", error);
                toaster.create({
                    type: 'error',
                    title: 'Erreur',
                    description: "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer."
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Toaster />
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="calc(100vh - 120px)"
                p={4}
            >
                <Box
                    maxW="lg"
                    w="full"
                    p={6}
                    borderRadius="lg"
                    shadow="md"
                    borderWidth="1px"
                >
                    <Text as="h1" fontSize="2xl" fontWeight="bold" textAlign="center" mb={6}>
                        Contactez-nous
                    </Text>

                    <Fieldset.Root>
                        <Fieldset.Content as={VStack} gap={4}>
                            <Field.Root>
                                <Field.Label mb={2}>Nom</Field.Label>
                                <Input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Entrez votre nom"
                                    required
                                />
                                {errors.name && (
                                    <Field.ErrorText>{errors.name}</Field.ErrorText>
                                )}
                            </Field.Root>

                            <Field.Root>
                                <Field.Label mb={2}>Email</Field.Label>
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Entrez votre email"
                                    required
                                />
                                {errors.email && (
                                    <Field.ErrorText>{errors.email}</Field.ErrorText>
                                )}
                            </Field.Root>

                            <Field.Root>
                                <Field.Label mb={2}>Message</Field.Label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Entrez votre message"
                                    rows={4}
                                    required
                                />
                                {errors.message && (
                                    <Field.ErrorText>{errors.message}</Field.ErrorText>
                                )}
                            </Field.Root>

                            <Button
                                type="submit"
                                colorPalette="orange"
                                w="full"
                                mt={4}
                                onClick={handleSubmit}
                                loading={isLoading} // Changed from 'loading' to 'isLoading'
                                disabled={isLoading}
                            >
                                Envoyer le message
                            </Button>
                        </Fieldset.Content>
                    </Fieldset.Root>
                </Box>
            </Box>
        </>
    );
}
