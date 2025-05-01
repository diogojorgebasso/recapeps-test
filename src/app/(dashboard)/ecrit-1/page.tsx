import { useEffect, useState } from "react";
import { subjects } from "./subjects";
import {
    Box,
    Card,
    Heading,
    SimpleGrid,
    Image,
    Button,
    Link,
    Dialog,
    Tabs
} from "@chakra-ui/react";
import { Toaster, toaster } from "@/components/ui/toaster"

import { useAuth } from "@/components/AuthProvider";
import SkillTreeClient from "./SkillTreeClient";

export default function Ecrit1Page() {
    const { isPro } = useAuth();

    return (
        <>
            <Toaster />
            <Tabs.Root>
                <Tabs.List>
                    <Tabs.Trigger value="apprendre" colorScheme="blue" fontSize="2xl" fontWeight="bold">
                        Apprendre
                    </Tabs.Trigger>
                    <Tabs.Trigger value="s-entraner" colorScheme="blue" fontSize="2xl" fontWeight="bold">
                        S'entrâner
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="apprendre">
                    <Box>
                        <Box mb="12">
                            <Heading size="xl" mb="4" color="blue.600">
                                Écrit 1
                            </Heading>
                            <SimpleGrid columns={[1, 2, 3]} gap="6">
                                {subjects.map(({ id, name, image, premium }) => (
                                    <ExamCard
                                        key={id}
                                        name={name}
                                        image={image}
                                        premium={premium}
                                        isUserPremium={isPro}
                                        vers={id}
                                    />
                                ))}
                            </SimpleGrid>
                        </Box>
                    </Box >
                </Tabs.Content>
                <Tabs.Content value="s-entraner">
                    <SkillTreeClient quizzes={[
                        { id: "1", subject: "Travail des élèves", level: 1, state: "doing" },
                        { id: "2", subject: "Les techniques", level: 2, state: "passed" },
                        { id: "3", subject: "Sport scolaire", level: 3, state: "retry" },
                    ]} />
                </Tabs.Content>

            </Tabs.Root>
        </>
    );
}

function ExamCard({
    name,
    image,
    premium,
    isUserPremium,
    vers
}: {
    name: string;
    image: string;
    premium: boolean;
    isUserPremium: boolean;
    vers: string;
}) {
    if (isUserPremium) {
        return (
            <Card.Root maxW="sm" overflow="hidden" borderWidth="1px" borderRadius="lg" shadow="md">
                <Image src={image} alt={name} maxH="200px" w="100%" />
                <Card.Body gap="2" p="4">
                    <Card.Title>{name}</Card.Title>
                </Card.Body>
                <Card.Footer gap="2" p="4">
                    <Button variant="solid" asChild>
                        <a target="_blank" href={vers}>Voir plus</a>
                    </Button>
                </Card.Footer>
            </Card.Root>
        );
    }
    else {
        return (
            <Card.Root maxW="sm" overflow="hidden" borderWidth="1px" borderRadius="lg" shadow="md">
                <Image src={image} alt={name} />
                <Card.Body gap="2" p="4">
                    <Card.Title>{name} {premium ? "🔒" : ""}</Card.Title>
                </Card.Body>
                <Card.Footer gap="2" p="4">
                    {premium ?
                        <Dialog.Root>
                            <Dialog.Trigger asChild>
                                <Button size="sm">
                                    Voir plus
                                </Button>
                            </Dialog.Trigger>
                            <Dialog.Content>
                                <Dialog.Header>
                                    <Dialog.Title>Passer à Recap'eps pro?
                                    </Dialog.Title>
                                </Dialog.Header>
                                <Dialog.Body>
                                    <p>
                                        Tu apprécies le contenu que nous te proposons mais tu restes sur ta faim? Tu aimerai accéder à tout le contenu que nous t'avons concocté? Alors n'hésite plus et passe à Recap'eps pro ! 🎯
                                    </p>
                                </Dialog.Body>
                                <Dialog.Footer>
                                    <Dialog.ActionTrigger asChild>
                                        <Button variant="outline">Non, merci</Button>
                                    </Dialog.ActionTrigger>
                                    <Button variant="solid">
                                        <Link href="/checkout">Oui par pitié</Link>
                                    </Button>
                                </Dialog.Footer>
                                <Dialog.CloseTrigger />
                            </Dialog.Content>
                        </Dialog.Root>
                        :
                        <Button variant="solid" asChild>
                            <a target="_blank" href={vers}>Voir plus</a>
                        </Button>}
                </Card.Footer>
            </Card.Root>
        );
    }
}