"use client";

import { submitContactForm } from "./action";
import { useEffect } from "react";
import {
    Box,
    Button,
    Input,
    Textarea,
    Text,
    Fieldset,
    VStack,
    Field
} from "@chakra-ui/react";
import { useActionState } from 'react'
import { Toaster, toaster } from "@/components/ui/toaster"

export default function Contact() {
    const [state, action, pending] = useActionState(submitContactForm, undefined)

    // Effect to show toast messages based on the server action state
    useEffect(() => {
        if (state?.success) {
            toaster.create({
                title: "Message Sent.",
                description: state.message,
                type: "success",
            });
        } else if (state?.error) {
            toaster.create({
                title: "Error.",
                description: state.error,
                type: "error",
            });
        }
    }, [state]); // Depend on state and toast

    return (
        <>
            <Toaster></Toaster>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="calc(100vh - 120px)" // Adjust height if needed
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

                    <form action={action}>
                        <Fieldset.Root>
                            <Fieldset.Content as={VStack} gap={4} >
                                <Field.Root>
                                    <Field.Label mb={2}>Nom</Field.Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        placeholder="Entrez votre nom"
                                        required
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label mb={2}>Email</Field.Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder="Entrez votre email"
                                        required
                                    />
                                </Field.Root>

                                <Field.Root>
                                    <Field.Label mb={2}>Message</Field.Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        placeholder="Entrez votre message"
                                        rows={4}
                                        required
                                    />
                                </Field.Root>

                                <Button
                                    type="submit"
                                    colorScheme="orange"
                                    w="full"
                                    mt={4}
                                    loading={pending}
                                    disabled={pending}
                                >
                                    Envoyer le Message
                                </Button>
                            </Fieldset.Content>
                        </Fieldset.Root>
                    </form>
                </Box>
            </Box>
        </>
    );
}
