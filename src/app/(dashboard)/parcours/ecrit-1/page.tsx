"use client";

import { useEffect, useState, Suspense } from "react";
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
    Center,
    Portal,
    CloseButton,
} from "@chakra-ui/react";
import SkillTreeClient from "./SkillTreeClient";
import { getProgressOverview } from "@/repositories/quizRepo";
import { QuizTrail } from "@/types/TreeSkill";
import { useUserWithClaims } from "@/lib/getUser";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page() {
    const { user, pro } = useUserWithClaims();
    const router = useRouter();
    const [quizNodesArray, setQuizNodesArray] = useState<QuizTrail[]>([]);
    useEffect(() => {
        if (!user) {
            router.push("/login?redirect=/parcours/ecrit-1");
        };
        const fetchData = async () => {
            try {
                const progressData = await getProgressOverview(user?.uid, 1);
                setQuizNodesArray(progressData || []);
            } catch (error) {
                console.error("Failed to fetch progress overview:", error);
                setQuizNodesArray([]);
            }
        };
        fetchData();
    }, [user, router]);

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
                <Box mb="12">
                    <Heading size="xl" mb="4" color="blue.600">
                        Écrit 1
                    </Heading>
                    <SimpleGrid columns={[1, 2, 3]} gap="6">
                        {subjects.map(({ id, name, image, premium, link }) => (
                            <ExamCard
                                key={id}
                                name={name}
                                image={image}
                                premium={premium}
                                isUserPro={pro}
                                id={id}
                                link={link}
                            />
                        ))}
                    </SimpleGrid>
                </Box>
            </Tabs.Content>
            <Tabs.Content value="s-entraner">
                <Suspense fallback={<Center h="50vh"><Spinner size="lg" /></Center>}>
                    <SkillTreeClient quizzes={quizNodesArray} />
                </Suspense>
            </Tabs.Content>
        </Tabs.Root>
    );
}

function ExamCard({
    id,
    name,
    image,
    premium,
    isUserPro,
    link
}: {
    id: string;
    name: string;
    image: string;
    premium: boolean;
    isUserPro: boolean;
    link: string;
}) {
    if (!isUserPro && premium) {
        // blocked.
        return (
            <Card.Root
                variant="subtle"
                maxW="sm" overflow="hidden"
                borderWidth="1px" borderRadius="lg" shadow="md">
                <Image
                    filter="grayscale(70%)"
                    opacity={0.7}
                    src={image}
                    alt={name}
                    maxH="200px"
                    w="100%"
                    objectFit="cover" />
                <Card.Body gap="2" p="4">
                    <Card.Title>{name}</Card.Title>
                    <Text fontSize="sm" color="gray.500">
                        Contenu réservé aux membres&nbsp;Pro
                    </Text>
                </Card.Body>
                <Card.Footer gap="2" p="4">
                    <Dialog.Root>
                        <Dialog.Trigger asChild>
                            <Button size="sm">
                                Découvrir le contenu
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
                </Card.Footer>
            </Card.Root>
        );
    }
    return (
        <Card.Root maxW="sm" overflow="hidden" borderWidth="1px" borderRadius="lg" shadow="md">
            <Image src={image} alt={name} maxH="200px" w="100%" objectFit="cover" />
            <Card.Body gap="2" p="4">
                <Card.Title>{name}</Card.Title>
            </Card.Body>
            <Card.Footer gap="2" p="4">
                <Button variant="solid" asChild>
                    <a href={link}>Voir plus</a>
                </Button>
            </Card.Footer>
        </Card.Root>
    );
}
