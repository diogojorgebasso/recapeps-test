import {
    Box,
    Flex,
    HStack,
    Text,
    SimpleGrid,
    VStack,
    Button,
    Menu
} from "@chakra-ui/react";
import NextLink from "next/link";
import ContextualAvatar from "./ContextualAvatar";
import { ColorModeButton } from "@/components/ui/color-mode";
import { FaChevronDown } from "react-icons/fa";

export default function DesktopMenu() {
    return (
        <Box
            position="sticky"
            top={0}
            px={4}
            py={2}
            width="100%"
            zIndex="sticky"
            bg="gray.100"
            _dark={{ bg: "gray.950" }}
        >
            <Flex justify="space-between" width="100%">
                <HStack gap={8}>
                    <NextLink href="/" passHref>
                        <Text fontSize="lg" fontWeight="bold">
                            Accueil
                        </Text>
                    </NextLink>
                    <Menu.Root>
                        <Menu.Trigger asChild>
                            <Button variant="plain" fontWeight="bold">
                                <Text fontSize="lg">Fonctionnalités</Text> <FaChevronDown />
                            </Button>
                        </Menu.Trigger>
                        <Menu.Positioner>
                            <Menu.Content p={4} boxShadow="lg" borderRadius="md" maxW="lg">
                                <SimpleGrid columns={2} gap={4}>
                                    <Menu.Item value="dashboard" asChild>
                                        <NextLink href="/dashboard" passHref>
                                            <VStack align="start">
                                                <Text fontSize="sm" fontWeight="bold">
                                                    Tableau de bord
                                                </Text>
                                                <Text color="gray.500">
                                                    Gérez vos activités et accédez rapidement à toutes vos ressources éducatives.
                                                </Text>
                                            </VStack>
                                        </NextLink>
                                    </Menu.Item>
                                    <Menu.Item value="notes" asChild>
                                        <NextLink href="/notes" passHref>
                                            <VStack align="start">
                                                <Text fontSize="sm" fontWeight="bold">
                                                    Fiches de révision
                                                </Text>
                                                <Text color="gray.500">
                                                    Synthèse des grands thèmes pour le concours.
                                                </Text>
                                            </VStack>
                                        </NextLink>
                                    </Menu.Item>
                                    <Menu.Item value="flashcards" asChild>
                                        <NextLink href="/flashcards" passHref>
                                            <VStack align="start">
                                                <Text fontSize="sm" fontWeight="bold">
                                                    Flashcards
                                                </Text>
                                                <Text color="gray.500">
                                                    Retiens efficacement les connaissances nécessaires pour les écrits.
                                                </Text>
                                            </VStack>
                                        </NextLink>
                                    </Menu.Item>
                                    <Menu.Item value="quiz" asChild>
                                        <NextLink href="/quiz" passHref>
                                            <VStack align="start">
                                                <Text fontSize="sm" fontWeight="bold">
                                                    Quiz
                                                </Text>
                                                <Text color="gray.500">
                                                    Teste ta compréhension après avoir lu une fiche.
                                                </Text>
                                            </VStack>
                                        </NextLink>
                                    </Menu.Item>
                                </SimpleGrid>
                            </Menu.Content>
                        </Menu.Positioner>
                    </Menu.Root>
                    <NextLink href="/a-propos" passHref>
                        <Text fontSize="lg" fontWeight="bold">
                            À propos
                        </Text>
                    </NextLink>
                    <NextLink href="/contact" passHref>
                        <Text fontSize="lg" fontWeight="bold">
                            Contact
                        </Text>
                    </NextLink>
                </HStack>
                <HStack gap={4} ml="auto">
                    <ContextualAvatar />
                    <ColorModeButton />
                </HStack>
            </Flex>
        </Box>
    );
}
