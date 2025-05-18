"use client";
import { Box, Heading, Text, VStack, List } from "@chakra-ui/react";

import { useEffect, useState } from "react";
import getTranscription from "../getTranscription";
import { useUserWithClaims } from "@/lib/getUser";
import { TranscriptionData } from "@/types/Transcript";

const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return 'N/A';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Page = () => {

  const [transcription, setTranscription] = useState<TranscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUserWithClaims();


  useEffect(() => {

    if (!user) {
      // If user is explicitly null or undefined after initial check, handle appropriately.
      // For example, if useUserWithClaims initially returns undefined then null.
      if (user === null) {
        setError("Utilisateur non connecté."); // More specific error for null user
      } else {
        setError("User ID is missing.");
      }
      setIsLoading(false);
      return;
    }

    const fetchTranscriptData = async () => {
      const startTime = Date.now(); // Record start time
      setIsLoading(true);
      setError(null);

      let data = null;
      let fetchError: any = null;

      try {
        // Ensure getTranscription is compatible with the data it returns or cast appropriately
        data = await getTranscription(user.uid, "assiduite"); // Assuming user.uid is available
      } catch (err: any) {
        console.error("Failed to fetch transcription:", err);
        fetchError = err;
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = 4000 - elapsedTime;

      const updateState = () => {
        if (fetchError) {
          setError(fetchError.message || "Failed to load transcription.");
          setTranscription(null);
        } else if (data) {
          setTranscription(data as TranscriptionData);
        } else {
          setTranscription(null); // Explicitly set to null if no data
          setError("Transcription not found.");
        }
        setIsLoading(false);
      };

      if (remainingTime > 0) {
        setTimeout(updateState, remainingTime);
      } else {
        updateState();
      }
    };

    fetchTranscriptData();
  }, [user]);

  return (
    <Box p={5} maxW="3/4" mx="auto" boxShadow="md">
      <VStack align="start">
        <Box
          w={{ base: "90%", md: "70%", lg: "66%" }}
          border="5px solid"
          borderRadius="lg"
          p={{ base: 4, md: 6 }}
          boxShadow="md"
          textAlign="center"
          alignSelf={"center"}
          my={"4"}
        >
          <Text fontWeight="bold">Sujet disciplinaire</Text>
          <Text mt={4}>
            Vous êtes professeur d&apos;EPS en lycée, le jour de l&apos;évaluation d&apos;un cycle de danse, une élève de seconde refuse catégoriquement de présenter sa chorégraphie avec son groupe devant toute la classe.
          </Text>
          <Text mt={2}>
            Comment analysez-vous cette situation et quelles solutions envisagez-vous ?
          </Text>
        </Box>

        {transcription ? (
          <Box
            p={4}
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
            fontSize="md"
            whiteSpace="pre-wrap"
            w="full"
          >
            <Text fontWeight="bold">Fichier: {transcription.fileName}</Text>
            <Text fontSize="sm" color="gray.500">
              Taille: {formatFileSize(transcription.fileSize)} | Type: {transcription.contentType}
            </Text>
            <Text mt={2}>{transcription.transcription}</Text>
          </Box>
        ) : (
          !isLoading && !error && (
            <Text color="gray.500" fontStyle="italic">
              Aucune transcription disponible pour l&apos;ID fourni ou les critères.
            </Text>
          )
        )}

        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">Évaluation de fin de cycle</Text> : obligatoire, donne lieu à une note</Text>
          <Text><Text fontWeight="bold" as="span">Lycée</Text> : notes importantes pour l&apos;orientation / période de construction identitaire</Text>
          <Text><Text fontWeight="bold" as="span">Une élève</Text> : fille</Text>
          <Text><Text fontWeight="bold" as="span">Refuse catégoriquement </Text>: opposition totale</Text>
          <Text><Text fontWeight="bold" as="span">Danse / chorégraphie </Text>: activité de représentation, de mise en avant du corps. Représentation devant un public imposé dans les textes.</Text>
          <Text><Text fontWeight="bold" as="span">Devant toute la classe </Text>: grand groupe de spectateurs</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Hypothèses explicatives découlant des définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">H1 :</Text> l’élève craint le regard des autres.</Text>
          <Text><Text fontWeight="bold" as="span">H2 :</Text> l’élève se sent incompétente / peur d’avoir une mauvaise note.</Text>
          <Text><Text fontWeight="bold" as="span">H3 :</Text> l’élève est cible de moqueries, ne se sent pas à l’aise dans la classe.</Text>
          <Text>Nous retiendrons prioritairement la première hypothèse (H1). L’activité de représentation que constitue la danse pose fréquemment la peur de se montrer devant les autres.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Valeurs de la république soulevées</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Prioritaire (pour H1) :</Text>
          <Text>Assiduité scolaire</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Secondaires :</Text>
          <Text>Climat de classe</Text>
          <Text>Réussite scolaire</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Dilemme de l’enseignant</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>Faire appliquer le principe d’assiduité et les programmes scolaires, tout en ne braquant pas encore plus l’élève en question.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Éléments de réponses</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Court terme :</Text>
          <Text>Communication : prendre l’élève à part pour discuter et comprendre la raison du refus.</Text>
          <Text>Expliquer l’obligation d’assiduité.</Text>
          <Text>Proposer une alternative : présenter la chorégraphie devant l’enseignant.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Moyen terme :</Text>
          <Text>Préventif : Mettre en place dès le début de séquence et à chaque leçon, un moment de représentation devant un public, d’abord restreint (un camarade), puis de plus en plus important (un groupe, la demi-classe, la classe…).</Text>
          <Text>Apprendre à la classe à faire un retour constructif et non pas une critique, pour effacer la peur du jugement.</Text>
          <Text>Proposer un moyen juste d’évaluation si le cas se présente : présenter la chorégraphie devant toute la classe est bonifié.</Text>
          <Text>Se mettre en relation avec d’autres enseignants (musique, théâtre…) pour proposer une progressivité et continuité dans les représentations devant les autres.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Long terme (cf. fiche « solution à long terme » pour plus de détail sur ces actions) :</Text>
          <Text>Mener un projet artistique et culturel en lien avec une compagnie de danse. L’objectif serait de présenter en fin d’année une chorégraphie de danse, sur scène, avec des artistes professionnels. L’idée d’avoir un objectif de représentation de toute la classe dans un projet ambitieux pourrait davantage motiver les élèves à se présenter devant un public.</Text>
          <Text>Mener en lien avec la psyEN des ateliers sur la confiance en soi.</Text>
        </List.Root>
      </VStack>
    </Box>
  );
};

export default Page;
