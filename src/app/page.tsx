import {
  Box,
  Button,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Image,
  Card,
  Stack,
  Icon,
  Highlight,
  LinkBox,
  LinkOverlay
} from "@chakra-ui/react";
import Link from "next/link";
import { LuNotebookPen, LuListTodo } from "react-icons/lu";
import { FiBookOpen } from "react-icons/fi"
import Logo from "@/components/ui/logo-recapeps";

export default function Home() {

  return (
    <Box >
      <VStack alignItems="center" width="100%" textAlign="center">
        <Logo />
        <Heading as="h1" size="5xl" letterSpacing="tight">
          <Highlight query="RECAP'EPS" styles={{ color: "orange.600" }}>
            Bienvenue sur RECAP'EPS
          </Highlight>
        </Heading>
        <Heading size={{ base: "xl", md: "2xl" }} as="h2">
          Réussir ce n'est qu'une question d'entraînement, avec Recap'eps, s'entraîner n'a jamais été aussi facile 😎
        </Heading>
        <Stack
          direction={{ base: "column", md: "row" }}
          align="center"
        >
          <Button
            rounded="full"
            asChild
            size="2xl"
            bg="orange.500"
            color="white"
            _hover={{
              bg: "orange.600",
              transform: "scale(1.1)"
            }}
          >
            <Link href="/dashboard">COMMENCER MAINTENANT</Link>
          </Button>
          <Image alt="Avatar running" height="100px" width="100px" src="/avatar.svg" />
        </Stack>
      </VStack>

      <Box bgRepeat="no-repeat" bgAttachment="fixed" bgImage="url(./bandeau-home-vert.svg)" bgSize="cover" position="top">
        <SimpleGrid p={4} minChildWidth="sm" gap="8">
          <LinkBox>
            <Card.Root size="lg" variant="elevated" border="1px" borderColor="gray.200">
              <Card.Header>
                <Icon fontSize="40px">
                  <LinkOverlay href="/flashcards">
                    <LuNotebookPen />
                  </LinkOverlay>
                </Icon>
              </Card.Header>
              <Card.Body gap={4}>
                <Card.Title fontSize="3xl" color="orange.500">FlashCards</Card.Title>
                <Text fontSize="xl">
                  Retiens efficacement toutes les connaissances donc tu auras besoin pour les écrits !
                </Text>
              </Card.Body>
            </Card.Root>
          </LinkBox>

          <LinkBox>
            <Card.Root size="lg" variant="elevated" border="1px" borderColor="gray.200">
              <Card.Header>
                <Icon fontSize="40px">
                  <LinkOverlay href="/notes">
                    <FiBookOpen />
                  </LinkOverlay>
                </Icon>
              </Card.Header>
              <Card.Body gap={4}>
                <Card.Title fontSize="3xl" color="orange.500">
                  Fiches de révision
                </Card.Title>
                <Text fontSize="xl">
                  Nous t'avons fait une synthèse de tous les grands thèmes que tu risques de rencontrer au concours.
                </Text>
              </Card.Body>
            </Card.Root>
          </LinkBox>

          <LinkBox>
            <Card.Root size="lg" variant="elevated" border="1px" borderColor="gray.200">
              <Card.Header>
                <Icon fontSize="40px">
                  <LinkOverlay href="/quiz">
                    <LuListTodo />
                  </LinkOverlay>
                </Icon>
              </Card.Header>
              <Card.Body gap={4}>
                <Card.Title fontSize="3xl" color="orange.500">
                  Quiz
                </Card.Title>
                <Text fontSize="xl">
                  Après avoir lu une fiche, fais des quiz associés pour voir si tu as bien compris et assimilé le cours !
                </Text>
              </Card.Body>
            </Card.Root>
          </LinkBox>

        </SimpleGrid>
      </Box>
    </Box>
  );
}
