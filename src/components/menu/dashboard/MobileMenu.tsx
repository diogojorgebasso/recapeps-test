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
            zIndex="sticky"
            bg="gray.100"
            _dark={{ bg: "gray.950" }}
        >
            <HStack justify="space-around" py={2}>
                <Link href="/parcours/dashboard">
                    <FaHome size={26} />
                </Link>
                <Link href="/parcours/ecrit-1">
                    <FaPencilAlt size={26} />
                </Link>
                <Link href="/parcours/ecrit-2">
                    <FaPencilRuler size={26} />
                </Link>
                <Link href="/parcours/oral-1">
                    <RxChatBubble size={26} />
                </Link>
                <Link href="/parcours/oral-3">
                    <SlSpeech size={26} />
                </Link>
                <Link href="/compte/profil">
                    <FaRegUserCircle size={26} />
                </Link>
            </HStack>

        </Box>
    );
}
