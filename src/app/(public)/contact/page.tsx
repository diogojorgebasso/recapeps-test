'use client';

import { submitContactForm } from "./action";
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

export default function Page() {
    const [state, action, pending] = useActionState(submitContactForm, undefined)

    return (
        <>
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
                                    colorPalette="orange"
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
