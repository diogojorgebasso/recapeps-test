import { Box, HStack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

export default function MobileMenu() {
    return (
        <Box
            as="footer"
            position="fixed"
            bottom={0}
            left={0}
            width="100%"
            bg="gray.100"
            _dark={{ bg: "gray.950" }}
            zIndex="sticky"
            borderTop="1px solid"
            borderColor="gray.200"
        >
            <HStack justify="space-around" p={2}>
                <NextLink href="/dashboard" passHref>
                    <Text fontSize="sm" fontWeight="bold">
                        Tableau de bord
                    </Text>
                </NextLink>
                <NextLink href="/notes" passHref>
                    <Text fontSize="sm" fontWeight="bold">
                        Fiches de révision
                    </Text>
                </NextLink>
                <NextLink href="/flashcards" passHref>
                    <Text fontSize="sm" fontWeight="bold">
                        Flashcards
                    </Text>
                </NextLink>
                <NextLink href="/quiz" passHref>
                    <Text fontSize="sm" fontWeight="bold">
                        Quiz
                    </Text>
                </NextLink>
                <NextLink href="/a-propos" passHref>
                    <Text fontSize="sm" fontWeight="bold">
                        À propos
                    </Text>
                </NextLink>
                <NextLink href="/contact" passHref>
                    <Text fontSize="sm" fontWeight="bold">
                        Contact
                    </Text>
                </NextLink>
            </HStack>
        </Box>
    );
}
