"use client";

import { useEffect, useState, Suspense } from "react"; // Import useEffect, useState
import { useRouter } from "next/navigation"; // Import for client-side navigation
import { subjects } from "./subjects";
import {
    Box,
    Card,
    Heading,
    SimpleGrid,
    Image,
    Button,
    Dialog,
    Tabs,
    Text,
    Spinner,
    Center
} from "@chakra-ui/react";
import SkillTreeClient from "./SkillTreeClient";
import { getProgressOverview } from "@/repositories/quizRepo";
import { QuizTrail } from "@/types/TreeSkill";
import { useAuth } from "@/contexts/Auth"; // Import useAuth
import Link from "next/link";

export default function Page() {
    const { user, pro } = useAuth();
    const router = useRouter();

    const [quizNodesArray, setQuizNodesArray] = useState<QuizTrail[]>([]);

    useEffect(() => {
        if (!user) {
            router.push("/login?redirect=/parcours/ecrit-1");
        } else {
            const fetchData = async () => {
                try {
                    // getProgressOverview uses client 'db' by default
                    const progressData = await getProgressOverview(undefined, user.uid, 1);
                    setQuizNodesArray(progressData || []);
                } catch (error) {
                    console.error("Failed to fetch progress overview:", error);
                    setQuizNodesArray([]); // Set to empty array on error
                }
            };
            fetchData();
        }
    }, [user, router]);


    if (!user) {
        // This case should ideally be handled by the redirect,
        // but as a fallback or if redirect hasn't completed.
        return (
            <Center h="80vh">
                <Text>Redirection vers la page de connexion...</Text>
            </Center>
        );
    }

    return (
        <Tabs.Root defaultValue="apprendre">
            <Tabs.List>
                <Tabs.Trigger value="apprendre" colorPalette="blue" fontSize="2xl" fontWeight="bold">
                    Apprendre
                </Tabs.Trigger>
                <Tabs.Trigger value="s-entraner" colorPalette="blue" fontSize="2xl" fontWeight="bold">
                    S&apos;entraîner
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
                                    isUserPremium={pro} // Use isPro from useAuth
                                    vers={id}
                                />
                            ))}
                        </SimpleGrid>
                    </Box>
                </Box >
            </Tabs.Content>
            <Tabs.Content value="s-entraner">
                <Suspense fallback={<Center h="50vh"><Spinner size="lg" /></Center>}>
                    <SkillTreeClient QuizNode={quizNodesArray} />
                </Suspense>
            </Tabs.Content>
        </Tabs.Root>
    );
}

function ExamCard({
    name,
    image,
    premium,
    isUserPremium, // This will now be the client-side isPro
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
                <Image src={image} alt={name} maxH="200px" w="100%" objectFit="cover" />
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
                <Image src={image} alt={name} maxH="200px" w="100%" objectFit="cover" />
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
                                    <Dialog.Title>Passer à Recap&apos;eps Pro?
                                    </Dialog.Title>
                                </Dialog.Header>
                                <Dialog.Body>
                                    <Text>
                                        Tu apprécies le contenu que nous te proposons mais tu restes sur ta faim? Tu aimerai accéder à tout le contenu que nous t&apos;avons concocté?
                                        Alors n&apos;hésite plus et passe à Recap&apos;eps Pro ! 🎯
                                    </Text>
                                </Dialog.Body>
                                <Dialog.Footer>
                                    <Dialog.ActionTrigger asChild>
                                        <Button variant="outline">Non, merci</Button>
                                    </Dialog.ActionTrigger>
                                    <Button asChild variant="solid">
                                        <Link href="/abbonnement">
                                            Oui par pitié
                                        </Link>
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