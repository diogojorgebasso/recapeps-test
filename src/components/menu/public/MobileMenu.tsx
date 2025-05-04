"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import Link from "next/link";

export default function MobileMenu() {
    return (
        <Box
            as="footer"
            pos="fixed"
            bottom={0}
            insetX={0}
            bg="bg.canvas"
            borderTop="1px solid"
            borderColor="border.default"
            zIndex="sticky"
        >
            <HStack justify="space-around" py={2}>
                {[
                    { href: "/dashboard", label: "Tableau de bord" },
                    { href: "/ecrit-1", label: "Écrit 1" },
                    { href: "/ecrit-2", label: "Écrit 2" },
                    { href: "/oral-1", label: "Oral 1" },
                    { href: "/oral-3", label: "Oral 3" },
                    { href: "/profil", label: "Profil" },
                    { href: "/contact", label: "Contact" },
                ].map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Text fontSize="xs" fontWeight="semibold">
                            {item.label}
                        </Text>
                    </Link>
                ))}
            </HStack>
        </Box>
    );
}
