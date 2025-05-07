import {
    Box,
    Flex,
    Text,
    Button,
    Menu,
    SimpleGrid,
    HStack,
    Portal
} from "@chakra-ui/react";
import { LuChevronDown, LuSparkles } from "react-icons/lu";
import Link from "next/link";
import ContextualAvatar from "./ContextualAvatar";
import { ColorModeButton } from "@/components/ui/color-mode";

/* route data lives right here for easy editing */
const NAV = [
    { href: "/dashboard", label: "Tableau de bord" },
    { href: "/ecrit-1", label: "Écrit 1" },
    { href: "/ecrit-2", label: "Écrit 2" },
    { href: "/oral-1", label: "Oral 1" },
    { href: "/oral-3", label: "Oral 3" },
] as const;

/** sticky top-bar shown ≥ 768 px */
export default function DesktopMenu() {
    return (
        <Box
            display={{ base: "none", md: "flex" }}
            as="header"
            pos="sticky"
            top={0}
            bg="gray.100"
            _dark={{ bg: "gray.950" }}
            px={4}
            py={2}
            zIndex="sticky"
        >
            <Flex justify="space-between" gap={8}>
                <HStack>
                    <Link href="/">
                        <Text fontSize="lg" fontWeight="bold">
                            Recap’eps
                        </Text>
                    </Link>

                    <Menu.Root>
                        <Menu.Trigger asChild>
                            <Button
                                variant="ghost"
                                fontWeight="bold"
                            >
                                Fonctionnalités
                                <LuChevronDown />
                            </Button>
                        </Menu.Trigger>
                        <Portal>
                            <Menu.Positioner>
                                <Menu.Content p={4} shadow="lg" rounded="md" maxW="lg">
                                    <SimpleGrid columns={2} gap={4}>
                                        {NAV.map((item) => (
                                            <Menu.Item value={item.label} key={item.href} asChild>
                                                <Link href={item.href}>
                                                    <Text fontWeight="semibold">{item.label}</Text>
                                                </Link>
                                            </Menu.Item>
                                        ))}
                                        <Menu.Item value="checkout" asChild>
                                            <LuSparkles />
                                            <Link href="/checkout">Passer Pro</Link>
                                        </Menu.Item>
                                    </SimpleGrid>
                                </Menu.Content>
                            </Menu.Positioner>
                        </Portal>
                    </Menu.Root>

                    <Link href="/contact">
                        <Text fontSize="lg" fontWeight="bold">
                            Contact
                        </Text>
                    </Link>
                </HStack>

                <HStack ml="auto" gap={4}>
                    <ContextualAvatar />
                    <ColorModeButton />
                </HStack>
            </Flex>
        </Box>
    );
}
