'use client';

import { Box, Flex, Icon, Link, VisuallyHidden } from "@chakra-ui/react";
import NextLink from 'next/link';
import { FaPen, FaBook, FaMicrophone, FaChalkboardUser, FaUser } from "react-icons/fa6";
import { usePathname } from 'next/navigation';

export default function MobileMenu() {
    const pathname = usePathname();

    // Determine active state for each link manually
    const isEcrit1Active = pathname?.startsWith("/ecrit-1");
    const isEcrit2Active = pathname?.startsWith("/ecrit-2");
    const isOral1Active = pathname?.startsWith("/oral-1");
    const isOral3Active = pathname?.startsWith("/oral-3");
    const isProfilActive = pathname?.startsWith("/profil");

    return (
        <Box
            as="nav"
            position="fixed"
            bottom="0"
            left="0"
            right="0"
            bg="white"
            borderTop="1px solid"
            borderColor="gray.200"
            p={2}
            display={{ base: 'block', md: 'none' }} // Show only on mobile
            zIndex="sticky"
            boxShadow="0 -2px 5px rgba(0,0,0,0.05)"
        >
            <Flex justify="space-around" align="center">
                {/* Écrit 1 Link */}
                <Link
                    as={NextLink}
                    href="/dashboard/ecrit-1"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    color={isEcrit1Active ? "blue.500" : "gray.600"}
                    _hover={{ textDecoration: 'none', color: 'blue.400' }}
                    fontSize="xs"
                    textAlign="center"
                    w="60px"
                >
                    <Icon as={FaPen} boxSize={5} mb={1} />
                    <VisuallyHidden>Écrit 1</VisuallyHidden>
                </Link>

                {/* Écrit 2 Link */}
                <Link
                    as={NextLink}
                    href="/dashboard/ecrit-2"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    color={isEcrit2Active ? "blue.500" : "gray.600"}
                    _hover={{ textDecoration: 'none', color: 'blue.400' }}
                    fontSize="xs"
                    textAlign="center"
                    w="60px"
                >
                    <Icon as={FaBook} boxSize={5} mb={1} />
                    <VisuallyHidden>Écrit 2</VisuallyHidden>
                </Link>

                {/* Oral 1 Link */}
                <Link
                    as={NextLink}
                    href="/dashboard/oral-1"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    color={isOral1Active ? "blue.500" : "gray.600"}
                    _hover={{ textDecoration: 'none', color: 'blue.400' }}
                    fontSize="xs"
                    textAlign="center"
                    w="60px"
                >
                    <Icon as={FaMicrophone} boxSize={5} mb={1} />
                    <VisuallyHidden>Oral 1</VisuallyHidden>
                </Link>

                {/* Oral 3 Link */}
                <Link
                    as={NextLink}
                    href="/dashboard/oral-3"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    color={isOral3Active ? "blue.500" : "gray.600"}
                    _hover={{ textDecoration: 'none', color: 'blue.400' }}
                    fontSize="xs"
                    textAlign="center"
                    w="60px"
                >
                    <Icon as={FaChalkboardUser} boxSize={5} mb={1} />
                    <VisuallyHidden>Oral 3</VisuallyHidden>
                </Link>

                {/* Profil Link */}
                <Link
                    as={NextLink}
                    href="/dashboard/profil"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    color={isProfilActive ? "blue.500" : "gray.600"}
                    _hover={{ textDecoration: 'none', color: 'blue.400' }}
                    fontSize="xs"
                    textAlign="center"
                    w="60px"
                >
                    <Icon as={FaUser} boxSize={5} mb={1} />
                    <VisuallyHidden>Profil</VisuallyHidden>
                </Link>
            </Flex>
        </Box>
    );
}
