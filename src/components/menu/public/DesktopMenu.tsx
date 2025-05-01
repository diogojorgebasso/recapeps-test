"use client";

import {
    Box,
    Flex,
    HStack,
    Text,
    Button,
    Menu,
    SimpleGrid,
    Portal,
} from "@chakra-ui/react";
import { LuChevronDown, LuSparkles } from "react-icons/lu";
import NextLink from "next/link";

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
            as="header"
            pos="sticky"
            top={0}
            bg="bg.canvas"
            borderBottom="1px solid"
            borderColor="border.default"
            px={4}
            py={2}
            zIndex="sticky"
        >
            <Flex align="center" gap={8}>
                <NextLink href="/">
                    <Text fontSize="lg" fontWeight="bold">
                        Recap’eps
                    </Text>
                </NextLink>

                {/* mega dropdown */}
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
                                            <NextLink href={item.href}>
                                                <Text fontWeight="semibold">{item.label}</Text>
                                            </NextLink>
                                        </Menu.Item>
                                    ))}
                                    <Menu.Item value="checkout" asChild>
                                        <LuSparkles />
                                        <NextLink href="/checkout">Passer Pro</NextLink>
                                    </Menu.Item>
                                </SimpleGrid>
                            </Menu.Content>
                        </Menu.Positioner>
                    </Portal>
                </Menu.Root>

                <NextLink href="/contact">
                    <Text fontSize="lg" fontWeight="bold">
                        Contact
                    </Text>
                </NextLink>

                <Flex ml="auto" align="center" gap={4}>
                    <ContextualAvatar />
                    <ColorModeButton />
                </Flex>
            </Flex>
        </Box>
    );
}
