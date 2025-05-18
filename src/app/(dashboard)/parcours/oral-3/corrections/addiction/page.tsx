"use client";

import { Box, Heading, Text, VStack, List } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import getTranscription from "../getTranscription";
import { useUserWithClaims } from "@/lib/getUser";

// Define a basic interface for TranscriptionData
interface TranscriptionData {
  transcription: string;
  originalFile: string;
  theme: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: any; // Firestore Timestamp or similar
}

export default function Page() {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUserWithClaims();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  useEffect(() => {

    if (!user) {
      setError("User ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchTranscriptData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Ensure getTranscription is compatible with the data it returns or cast appropriately
        const data = await getTranscription(user?.uid, "addiction");
        if (data) {
          setTranscription(data as TranscriptionData);
        } else {
          setTranscription(null); // Explicitly set to null if no data
          setError("Transcription not found.");
        }
      } catch (err: any) {
        console.error("Failed to fetch transcription:", err);
        setError(err.message || "Failed to load transcription.");
        setTranscription(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranscriptData();
  }, [user]);

  return (
    <Box p={5} maxW="3/4" mx="auto" boxShadow="md">
      <VStack align="start" gap={4}>

        <Heading size="lg">Transcription de l&apos;enregistrement</Heading>
        {isLoading && <Text>Chargement de la transcription...</Text>}
        {error && <Text color="red.500">Erreur: {error}</Text>}

        {transcription ? (
          <Box
            p={4}
            bg="gray.50"
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
          <Text fontWeight="bold">Sujet vie scolaire</Text>
          <Text mt={4}>
            Vous êtes professeur(e) d’Éducation Physique et Sportive dans un collège rural. Lors d’un CA, est constaté l’addiction des élèves aux écrans avec des conséquences sur les apprentissages.</Text>
          <Text mt={2}>
            Comment analysez-vous cette situation et quelles solutions envisagez-vous ?

          </Text>
        </Box>

        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">Collège rural</Text> : collège isolé, qui réunit des élèves des villages alentours.</Text>
          <Text><Text fontWeight="bold" as="span">CA</Text> : réunit l’ensemble des catégories de personnels de l’établissement.</Text>
          <Text><Text fontWeight="bold" as="span">Addiction aux écrans</Text> : conduite répétitive et surdimensionnée au outils numériques (tablettes, ordinateurs, téléphones, consoles…).</Text>
          <Text><Text fontWeight="bold" as="span">Conséquences</Text><Text fontWeight="bold" as="span"> sur les apprentissages scolaires</Text> : fatigue, concentration, sédentarité, chute des notes</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Hypothèses explicatives découlant des définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">H1 :</Text> Les collégiens ont un téléphone et passent beaucoup de temps dessus.</Text>
          <Text><Text fontWeight="bold" as="span">H2 :</Text> Les élèves habitent dans des villages différents et veulent garder contact.</Text>
          <Text><Text fontWeight="bold" as="span">H3 :</Text> les élèves passent plus de temps à jouer aux jeux vidéo qu’à travailler.</Text>
          <Text>Nous retiendrons prioritairement la première hypothèse (H1), qui est un fait de société constaté.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Valeurs de la république soulevées</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Prioritaires (pour H1) :</Text>
          <Text>Santé (addiction)</Text>
          <Text>Réussite scolaire</Text>
          <Text>Co-éducation</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Secondaires :</Text>
          <Text>Responsabilité</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Dilemme de l’enseignant</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>Agir sur des conduites addictives alors qu’elles ont certainement lieu en grande partie à la maison et non à l’école.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Éléments de réponses</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Court terme :</Text>
          <Text>Proposer de réaliser un sondage sur les conduites face aux écrans des élèves (temps passé, type d’utilisation…), que chaque professeur principal distribuera à sa classe.</Text>
          <Text>En faire une synthèse et reproposer une réunion afin de les analyser et trouver des solutions.</Text>
          <Text>Diffuser de façon anonyme les résultats parlants sous forme de graphique aux élèves et au parents.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Moyen terme :</Text>
          <Text>Faire réaliser aux élèves un carnet de bord (vie de classe ou arts-plastique) avec des objectifs à tenir chaque semaine. Par exemple : pas plus de 2h de téléphone par jour, maximum 1h sur les réseaux sociaux, arrêter les écrans à 20h…</Text>
          <Text>Impliquer les parents dans ces objectifs. Le professeur principal regarde les avancées lors de chaque vie de classe.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Long terme (cf. fiche « solution à long terme » pour plus de détail sur ces actions) :</Text>
          <Text>Faire intervenir l’association e-enfance concernant les addictions aux écrans (sensibilisation, prévention).</Text>
          <Text>Lors des projets de classe du collège (voyage scolaire, sortie scolaire…), imposer le total « sans écran ». But de recréer du lien entre les élèves, de leur faire reprendre goût) d’autres activités.</Text>
          <Text>Valoriser les « clubs » sur la pause méridienne, avec des activités que les élèves peuvent reprendre chez eux (ex : club rubis cube, club tricot, club bricolage…) plutôt que d’être sur leurs téléphone.</Text>
        </List.Root>
      </VStack>
    </Box>
  );
};

