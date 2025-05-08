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
    Tabs,
    Text
} from "@chakra-ui/react";
import SkillTreeClient from "./SkillTreeClient";
import { getProgressOverview } from "@/repositories/quizRepo";

import { QuizTrail } from "@/types/Quiz";
import { Suspense } from "react";

import { getAuthenticatedAppForUser } from "@/lib/firebase/serverApp";
import { redirect } from "next/navigation";

export default async function Page() {
    const { user, isPro } = await getAuthenticatedAppForUser();

    if (!user) { // this will be resolved in the Layout.
        redirect("/login?redirect=/parcours/ecrit-1");
    }

    const progressData = await getProgressOverview(user.uid, 1);
    console.log("progressData", progressData);
    const quizNodesArray: QuizTrail[] = progressData ? Object.values(progressData) : [];

    return (
        <Tabs.Root>
            <Tabs.List>
                <Tabs.Trigger value="apprendre" colorScheme="blue" fontSize="2xl" fontWeight="bold">
                    Apprendre
                </Tabs.Trigger>
                <Tabs.Trigger value="s-entraner" colorScheme="blue" fontSize="2xl" fontWeight="bold">
                    S&apos;entrâner
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
                <Suspense fallback={<div>Loading...</div>}>
                    <SkillTreeClient QuizNode={Promise.resolve(quizNodesArray)} />
                </Suspense>
            </Tabs.Content>

        </Tabs.Root>
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
                                    <Dialog.Title>Passer à Recap&apos;eps pro?
                                    </Dialog.Title>
                                </Dialog.Header>
                                <Dialog.Body>
                                    <Text>
                                        Tu apprécies le contenu que nous te proposons mais tu restes sur ta faim? Tu aimerai accéder à tout le contenu que nous t&apos;avons concocté?
                                        Alors n&apos;hésite plus et passe à Recap&apos;eps pro ! 🎯
                                    </Text>
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