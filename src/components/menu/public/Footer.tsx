import { Stack, Text, Container, HStack, Box } from "@chakra-ui/react";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
    return (
        <Container maxW="100%" color="white" as="footer" id="contact" bg="orange.500" py="4">
            <Stack
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align="center"
                gap={{ base: 4, md: 2 }} // Add better spacing for mobile
            >
                <Text fontSize="sm">
                    &copy; 2025 Recap&apos;eps
                </Text>

                <Link color="white" href="/legal/mentions-legales">Mentions légales</Link>
                <Link color="white" href="/legal/conditions-generales">Conditions générales de vente</Link>
                <Link color="white" href="/legal/politique-confidentialite">Politique de confidentialité</Link>

                <a href="https://instagram.com/recapeps"
                    aria-label="Recapeps sur Instagram"
                    target="_blank"
                    rel="noopener noreferrer">
                    <FaInstagram size="20px" />
                </a>
            </Stack>
        </Container>
    );
}
