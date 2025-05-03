import { Center, Spinner, Text } from "@chakra-ui/react";

export default function Loading() {
    return (
        <Center w="100%" h="100vh">
            <Spinner size="xl" />
            <Text ml={4} fontSize="lg">Chargement du quiz...</Text>
        </Center>
    );
}