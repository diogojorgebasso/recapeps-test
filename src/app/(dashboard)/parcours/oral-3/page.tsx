import Link from "next/link";
import {
    Box,
    Button,
    Card,
    CardBody,
    CardFooter,
    Flex,
    Heading,
    Center,
    SimpleGrid,
    Text,
    VStack,
    Dialog,
    Portal,
    CloseButton
} from "@chakra-ui/react";
import { subjects } from "./subjects";
import { subjects2 } from "./subjects2";
import type { IconType } from "react-icons";
import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";

/**
 * A single exam card.
 * Displays either an icon (preferred) or an image fallback.
 */
function ExamCard({
    id,
    name,
    IconCard,
    premium,
    isUserPro,
}: {
    id: string;
    name: string;
    IconCard: IconType;
    premium: boolean;
    isUserPro: boolean;
}) {
    const blocked = premium && !isUserPro;

    return (
        <Card.Root
            role="group"
            borderWidth="1px"
            shadow="sm"
            rounded="lg"
            overflow="hidden"
            position="relative"
            _hover={{ shadow: "md", transform: "translateY(-2px)", transition: "all 0.15s" }}
        >
            <Flex
                align="center"
                justify="center"
                pt={8}
                pb={4}
                color={blocked ? "gray.400" : "blue.500"}
                _groupHover={{ color: blocked ? "gray.400" : "blue.600" }}
            >
                <IconCard size={30} />
            </Flex>

            <CardBody textAlign="center" px={4} pb={blocked ? 2 : 4}>
                <Heading as="h3" size="md">
                    {name}
                </Heading>
                {blocked && (
                    <Text mt={1} fontSize="sm" color="gray.500">
                        Contenu réservé aux membres&nbsp;Pro
                    </Text>
                )}
            </CardBody>

            <CardFooter justifyContent="center" py={4}>
                {blocked ? (
                    <Button asChild size="sm" variant="solid">
                        <Link href="/abonnement">
                            Passer à Pro
                        </Link>
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        asChild
                    >
                        <Link href={`/parcours/oral-3/${id}`}>
                            Voir plus
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card.Root>
    );
}

function ExamCard2({
    id,
    name,
    IconCard,
    premium,
    isUserPro,
}: {
    id: string;
    name: string;
    IconCard: IconType;
    premium: boolean;
    isUserPro: boolean;
}) {
    const blocked = premium && !isUserPro;

    return (
        <Card.Root
            role="group"
            borderWidth="1px"
            shadow="sm"
            rounded="lg"
            overflow="hidden"
            position="relative"
            _hover={{ shadow: "md", transform: "translateY(-2px)", transition: "all 0.15s" }}
        >
            <Flex
                align="center"
                justify="center"
                pt={8}
                pb={4}
                color={blocked ? "gray.400" : "blue.500"}
                _groupHover={{ color: blocked ? "gray.400" : "blue.600" }}
            >
                <IconCard />
            </Flex>

            <CardBody textAlign="center" px={4} pb={blocked ? 2 : 4}>
                <Heading as="h3" size="md">
                    {name}
                </Heading>
                {blocked && (
                    <Text mt={1} fontSize="sm" color="gray.500">
                        Contenu réservé aux membres&nbsp;Pro
                    </Text>
                )}
            </CardBody>

            <CardFooter justifyContent="center" py={4}>
                {blocked ? (
                    <Button asChild size="sm" variant="solid">
                        <Link href="/abonnement">
                            Passer à Pro
                        </Link>
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        asChild
                    >
                        <Link href={`/parcours/oral-3/fiches/${id}`}>
                            Voir plus
                        </Link>
                    </Button>
                )}
            </CardFooter>
        </Card.Root>
    );
}

function getRandomSubject() {
    const randomIndex = Math.floor(Math.random() * subjects.length);
    return subjects[randomIndex];
}

export default async function Page() {
    const { pro } = await getAuthenticatedAppForUser();

    return (
        <Box px={{ base: 4, md: 8 }} py={8}>
            <Center>
                <VStack gap={4} mb={8}>
                    <Heading as="h1" size="xl" mb={2}>
                        Faire une simulation de l&apos;oral 3
                    </Heading>
                    <Text fontSize="lg" color="gray.500">
                        Entraine-toi sur un sujet aléatoire, comme le jour J !
                    </Text>
                    {pro ? (<Button shadow="md" size="xl" bg={"orange.500"} color="white" mt={4} asChild>
                        <Link href={`/parcours/oral-3/${getRandomSubject().id}`}>
                            Démarrer la simulation
                        </Link>
                    </Button>) :
                        (
                            <Dialog.Root>
                                <Dialog.Trigger asChild>
                                    <Button shadow="md" size="xl" bg={"orange.500"} color="white" mt={4} >
                                        Démarrer la simulation
                                    </Button>
                                </Dialog.Trigger>
                                <Portal>
                                    <Dialog.Backdrop />
                                    <Dialog.Positioner>
                                        <Dialog.Content>
                                            <Dialog.Header>
                                                <Dialog.Title>Contenu exclusif Recap&apos;eps Pro</Dialog.Title>
                                            </Dialog.Header>
                                            <Dialog.Body > {/* Ensure Dialog.Body is a div */}
                                                <Text>
                                                    Tu apprécies le contenu que nous te proposons mais tu restes sur ta faim? Tu aimerais accéder à tout le contenu que nous t&apos;avons concocté?
                                                    Alors n&apos;hésite plus et passe à Recap&apos;eps Pro ! 🎯
                                                </Text>
                                            </Dialog.Body>
                                            <Dialog.Footer>
                                                <Dialog.ActionTrigger asChild>
                                                    <Button variant="outline">Plus tard</Button>
                                                </Dialog.ActionTrigger>
                                                <Button asChild variant="solid">
                                                    <Link href="/abonnement">
                                                        Passer à Pro
                                                    </Link>
                                                </Button>
                                            </Dialog.Footer>
                                            <Dialog.CloseTrigger asChild>
                                                <CloseButton size="sm" />
                                            </Dialog.CloseTrigger>
                                        </Dialog.Content>
                                    </Dialog.Positioner >
                                </Portal>
                            </Dialog.Root>
                        )
                    }
                </VStack>
            </Center>
            <Text mb={8} fontSize="lg">
                Sinon, choisis le thème sur lequel tu souhaites t&apos;entrainer :
            </Text>


            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={6}>
                {subjects.map(({ id, name, icon, premium }) => (
                    <ExamCard
                        key={id}
                        id={id}
                        name={name}
                        IconCard={icon as IconType}
                        premium={premium}
                        isUserPro={pro}
                    />
                ))}
            </SimpleGrid>
            <Heading id="fiches" size="2xl" mt={4}>Fiches de révision</Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={6} mt={4}>
                {subjects2.map(({ id, name, icon, premium }) => (
                    <ExamCard2
                        key={id}
                        id={id}
                        name={name}
                        IconCard={icon as IconType}
                        premium={premium}
                        isUserPro={pro}
                    />
                ))}
            </SimpleGrid>
        </Box>
    );
}
