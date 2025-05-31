import {
  Box,
  Button,
  Center,
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
  LinkOverlay,
  Grid,
  GridItem,
  Flex
} from "@chakra-ui/react";
import Link from "next/link";
import { LuNotebookPen, LuListTodo } from "react-icons/lu";
import { FiBookOpen } from "react-icons/fi"
import Logo from "@/components/ui/logo-recapeps";
import Quiz from "./Quiz";

export default function Home() {
  return (
    <Box >
      <VStack alignItems="center" width="100%" textAlign="center">
        <Logo />
        <Heading as="h1" size="5xl" letterSpacing="tight">
          <Highlight query="RECAP'EPS" styles={{ color: "orange.600" }}>
            Bienvenue sur RECAP&apos;EPS
          </Highlight>
        </Heading>
        <Heading size={{ base: "xl", md: "2xl" }} as="h2">
          Réussir ce n&apos;est qu&apos;une question d&apos;entraînement, avec Recap&apos;eps, s&apos;entraîner n&apos;a jamais été aussi facile 😎
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
            <Link href="/parcours/dashboard">COMMENCER MAINTENANT</Link>
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
                  <LinkOverlay href="#ecrit1">
                    <LuNotebookPen />
                  </LinkOverlay>
                </Icon>
              </Card.Header>
              <Card.Body gap={4}>
                <Card.Title fontSize="3xl" color="orange.500">Écrit 1</Card.Title>
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
                  <LinkOverlay href="#ecrit2">
                    <FiBookOpen />
                  </LinkOverlay>
                </Icon>
              </Card.Header>
              <Card.Body gap={4}>
                <Card.Title fontSize="3xl" color="orange.500">
                  Écrit 2
                </Card.Title>
                <Text fontSize="xl">
                  Nous t&apos;avons fait une synthèse de tous les grands thèmes que tu risques de rencontrer au concours.
                </Text>
              </Card.Body>
            </Card.Root>
          </LinkBox>

          <LinkBox>
            <Card.Root size="lg" variant="elevated" border="1px" borderColor="gray.200">
              <Card.Header>
                <Icon fontSize="40px">
                  <LinkOverlay href="#oral1">
                    <LuListTodo />
                  </LinkOverlay>
                </Icon>
              </Card.Header>
              <Card.Body gap={4}>
                <Card.Title fontSize="3xl" color="orange.500">
                  Oral 1
                </Card.Title>
                <Text fontSize="xl">
                  Pour te préparer à l&apos;oral 1, nous avons mis à ta disposition des fiches spécifiques à chaque sport pour t&apos;aider à te préparer.
                </Text>
              </Card.Body>
            </Card.Root>
          </LinkBox>

          <LinkBox>
            <Card.Root size="lg" variant="elevated" border="1px" borderColor="gray.200">
              <Card.Header>
                <Icon fontSize="40px">
                  <LinkOverlay href="#oral3">
                    <LuListTodo />
                  </LinkOverlay>
                </Icon>
              </Card.Header>
              <Card.Body gap={4}>
                <Card.Title fontSize="3xl" color="orange.500">
                  Oral 3
                </Card.Title>
                <Text fontSize="xl">
                  Afin de performer à l&apos;oral 3, tu trouveras ici des fiches de révisions et des simulations d&apos;épreuves accompagnées de corrigés.
                </Text>
              </Card.Body>
            </Card.Root>
          </LinkBox>
        </SimpleGrid>
        <Box p={12}>
          <Text>
            Pour réviser efficacement les écrits, tu as accès à des fiches de révisions ainsi qu&apos;à des quiz qui te permettent de retenir toutes les connaissances dont tu auras besoin le jour J ✍️ <br /><br />
          </Text>
          <Box id="ecrit1">
            <Heading size="xl" mb={4}>
              Écrit 1
            </Heading>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} alignItems="stretch" >
              <GridItem>
                <Flex wrap="wrap" gap={4} justify="center" height="100%">
                  <Image
                    src="sante-p1.png"
                    alt="Écrit 1"
                    width={{ base: "100%", md: "300px" }}
                    height="auto"
                    objectFit="contain"
                  />
                  <Image
                    src="/sante-p2.png"
                    alt="Écrit 1"
                    width={{ base: "100%", md: "300px" }}
                    height="auto"
                    objectFit="contain"
                  />
                </Flex>
              </GridItem>              <GridItem>
                <VStack align="start" >
                  <Flex wrap="wrap" gap={4} justify="center" height="100%">
                    <Quiz quizId="quiz1" />
                  </Flex>
                </VStack>
              </GridItem>
            </Grid>
          </Box>

          {/* Écrit 2 */}
          <Box id="ecrit2">
            <Heading size="xl" mb={4}>
              Écrit 2
            </Heading>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              <GridItem>
                <Flex wrap="wrap" gap={4} justify="center" height="100%">
                  <Image
                    src="/competence-p1.png"
                    alt="Écrit 2"
                    height="auto"
                    objectFit="contain"
                    width={{ base: "100%", md: "300px" }}
                  />
                  <Image
                    src="/competence-p2.png"
                    alt="Écrit 2"
                    height="auto"
                    objectFit="contain"
                    width={{ base: "100%", md: "300px" }}
                  />
                </Flex>
              </GridItem>
              <GridItem>
                <VStack align="start">
                  <Flex wrap="wrap" gap={4} justify="center" height="100%">
                    <Quiz quizId="quiz2" />
                  </Flex>
                </VStack>
              </GridItem>
            </Grid>
          </Box>

          <Text>
            Pour réviser efficacement les oraux, tu as accès à des fiches de révision ainsi qu&apos;à des simulations d&apos;entretien d&apos;oral 3 <br /><br />
          </Text>

          <Box id="oral1">
            <Heading size="xl" mb={4}>
              Oral 1
            </Heading>
            <Text fontSize="lg">
              Pour réviser l&apos;oral 1, tu as accès à un résumé synthétique des infos utiles pour chaque sport
            </Text>
            <Center>
              <Image
                src="/oral-1.jpeg"
                alt="Oral 1"
                height="auto"
                width={{ base: "90%", md: "70%", lg: "50%" }}
              />
            </Center>
          </Box>


          <Box id="oral3" mt={8}>
            <Heading size="xl" mb={4}>
              Oral 3
            </Heading>
            <Text fontSize="lg" mb={4}>
              Pour réviser l&apos;oral 3, tu as non seulement accès à des synthèses de connaissances utiles, mais tu peux aussi t&apos;entrainer sur de vrais sujets comme si tu étais à l&apos;examen
            </Text>
            <Center>
              <Image
                src="/oral-3.jpeg"
                alt="Oral 3"
                height="auto"
                width={{ base: "90%", md: "70%", lg: "50%" }}
                maxWidth="600px"
              />
            </Center>

          </Box>
        </Box>
      </Box>
    </Box >
  );
}