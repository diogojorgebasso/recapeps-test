"use client";

import {
    VStack,
    IconButton,
} from "@chakra-ui/react";
import Link from "next/link";
import { BiSupport } from "react-icons/bi";
import { ColorModeButton } from "@/components/ui/color-mode";
import { usePathname } from "next/navigation";
import AvatarMenu from "./AvatarMenu";
import { FaPencilAlt, FaPencilRuler, FaHome } from "react-icons/fa"; //ecrit 1
import { RxChatBubble } from "react-icons/rx"; //oral 1
import { SlSpeech } from "react-icons/sl"

export default function DesktopMenu() {
    const pathname = usePathname();

    const isActive = (href: string) =>
        pathname === href || (href !== "/parcours/dashboard" && pathname.startsWith(href));

    return (
        <VStack
            as="nav"
            position="fixed"
            bg="orange.500"
            p="2"
            gap="6"
            shadow="lg"
            display={{ base: "none", md: "flex" }}
        >
            <AvatarMenu />

            <Link href="/parcours/dashboard" passHref>
                <IconButton
                    aria-label="Tableau de bord"
                    variant={isActive("/parcours/dashboard") ? "solid" : "ghost"}
                    bg={isActive("/parcours/dashboard") ? "orange.600" : undefined}
                    size="2xl"
                    color="white"
                    _hover={{ bg: "orange.600" }}
                >
                    <FaHome />
                </IconButton>
            </Link>

            <Link href="/parcours/ecrit-1" passHref>
                <IconButton
                    aria-label="Écrit 1"
                    variant={isActive("/parcours/ecrit-1") ? "solid" : "ghost"}
                    bg={isActive("/parcours/ecrit-1") ? "orange.600" : undefined}
                    size="2xl"
                    color="white"
                    _hover={{ bg: "orange.600" }}
                >
                    <FaPencilAlt />
                </IconButton>
            </Link>

            <Link href="/parcours/ecrit-2" passHref>
                <IconButton
                    aria-label="Écrit 2"
                    variant={isActive("/parcours/ecrit-2") ? "solid" : "ghost"}
                    bg={isActive("/parcours/ecrit-2") ? "orange.600" : undefined}
                    size="2xl"
                    color="white"
                    _hover={{ bg: "orange.600" }}
                >
                    <FaPencilRuler />
                </IconButton>
            </Link>

            <Link href="/parcours/oral-1" passHref>
                <IconButton
                    aria-label="Oral 1"
                    variant={isActive("/parcours/oral-1") ? "solid" : "ghost"}
                    bg={isActive("/parcours/oral-1") ? "orange.600" : undefined}
                    size="2xl"
                    color="white"
                    _hover={{ bg: "orange.600" }}
                >
                    <RxChatBubble />
                </IconButton>
            </Link>

            <Link href="/parcours/oral-3" passHref>
                <IconButton
                    aria-label="Oral 3"
                    variant={isActive("/parcours/oral-3") ? "solid" : "ghost"}
                    bg={isActive("/parcours/oral-3") ? "orange.600" : undefined}
                    size="2xl"
                    color="white"
                    _hover={{ bg: "orange.600" }}
                >
                    <SlSpeech />
                </IconButton>
            </Link>


            <Link href="/contact" passHref>
                <IconButton
                    aria-label="Contact"
                    variant={isActive("/contact") ? "solid" : "ghost"}
                    bg={isActive("/contact") ? "orange.600" : undefined}
                    size="2xl"
                    color="white"
                    _hover={{ bg: "orange.600" }}
                >
                    <BiSupport />
                </IconButton>
            </Link>

            <ColorModeButton my="5" />
        </VStack>
    );
}
