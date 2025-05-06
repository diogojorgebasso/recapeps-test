import { Box, HStack } from "@chakra-ui/react";
import Link from "next/link";
import { FaHome } from "react-icons/fa"; //home
import { FaPencilAlt } from "react-icons/fa"; //ecrit 1
import { FaPencilRuler } from "react-icons/fa"; //ecrit 2
import { RxChatBubble } from "react-icons/rx"; //oral 1
import { SlSpeech } from "react-icons/sl"
import { FaRegUserCircle } from "react-icons/fa";
export default function MobileMenu() {
    return (
        <Box
            display={{ base: "block", md: "none" }}
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
                <Link href="/parcours/dashboard">
                    <FaHome size={24} />
                </Link>
                <Link href="/parcours/ecrit-1">
                    <FaPencilAlt size={24} />
                </Link>
                <Link href="/parcours/ecrit-2">
                    <FaPencilRuler size={24} />
                </Link>
                <Link href="/parcours/oral-1">
                    <RxChatBubble size={24} />
                </Link>
                <Link href="/parcours/oral-3">
                    <SlSpeech size={24} />
                </Link>
                <Link href="/compte/profil">
                    <FaRegUserCircle size={24} />
                </Link>
            </HStack>
        </Box>
    );
}
