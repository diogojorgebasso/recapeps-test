/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Box, Heading, Text, VStack, List, Spinner, Alert } from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { useUserWithClaims } from "@/lib/getUser";
import { TranscriptionData, TranscriptionStatus } from "@/types/Transcript";
import { db, storage } from "@/lib/firebase/clientApp";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { ref as storageRef, getBlob } from "firebase/storage";

// Define SpeechApiResponse interface locally if not imported from elsewhere
interface SpeechApiResponseAlternative {
  transcript?: string;
  confidence?: number;
  // other properties if any
}

interface SpeechApiResult {
  alternatives?: SpeechApiResponseAlternative[];
  // other properties if any
}

interface SpeechApiResponse {
  results?: SpeechApiResult[];
  // other properties if any
}

// Placeholder for formatFileSize to prevent runtime errors
const formatFileSize = (bytes?: number): string => {
  if (bytes === undefined || bytes === null) return 'N/A';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function Page() {
  const [transcriptionDocData, setTranscriptionDocData] = useState<TranscriptionData | null>(null);
  const [fetchedTranscriptionText, setFetchedTranscriptionText] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<TranscriptionStatus>("processing"); // Start with processing
  const [error, setError] = useState<string | null>(null);

  const { user } = useUserWithClaims();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const [isFetchingJson, setIsFetchingJson] = useState(false); // Renamed from isFetchingText
  const fetchedPathRef = useRef<string | null>(null); // To track the path for which JSON has been fetched

  useEffect(() => {
    if (!user) {
      if (user === null) { // User is explicitly null (not undefined during loading)
        setError("Utilisateur non connecté ou ID de transcription manquant.");
      }
      setCurrentStatus("error");
      setFetchedTranscriptionText(null);
      fetchedPathRef.current = null;
      // Ensure cleanup if there was a previous subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Clean up previous listener if user changes
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Reset states for new user or new subscription
    setTranscriptionDocData(null);
    setFetchedTranscriptionText(null);
    setCurrentStatus("processing");
    setError(null);
    setIsFetchingJson(false);
    fetchedPathRef.current = null;

    const transcriptDocRef = doc(db, "users", user.uid, "transcripts", "citoyennete");

    unsubscribeRef.current = onSnapshot(transcriptDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as TranscriptionData;
        setTranscriptionDocData(data);
        const newStatus = data.status || "processing";
        setCurrentStatus(newStatus);
        // Clear general error when new data arrives, specific errors handled below
        if (newStatus !== "error" && newStatus !== "error_unsupported_type") {
          setError(null);
        }

        if (newStatus === "completed") {
          if (data.transcriptionJsonPath) {
            if (!isFetchingJson && (data.transcriptionJsonPath !== fetchedPathRef.current || fetchedTranscriptionText === null)) {
              setIsFetchingJson(true);
              fetchedPathRef.current = data.transcriptionJsonPath;
              setFetchedTranscriptionText(null); // Clear previous text before fetching new

              try {
                let pathInBucket = data.transcriptionJsonPath;
                if (pathInBucket.startsWith("gs://")) {
                  pathInBucket = pathInBucket.substring(pathInBucket.indexOf('/', 5) + 1);
                }

                const fileRef = storageRef(storage, pathInBucket);
                const blob = await getBlob(fileRef);
                const jsonText = await blob.text();
                const speechApiOutput = JSON.parse(jsonText) as SpeechApiResponse;
                if (speechApiOutput.results && speechApiOutput.results.length > 0) {
                  const combinedTranscript = speechApiOutput.results
                    .map(result => result.alternatives?.[0]?.transcript?.trim() ?? "")
                    .join(" ")
                    .replace(/\.\s+/g, ".\n\n")
                    .replace(/\?\s+/g, "?\n\n")
                    .replace(/!\s+/g, "!\n\n")
                    .trim();
                  setFetchedTranscriptionText(combinedTranscript);
                } else {
                  setFetchedTranscriptionText("Aucune transcription trouvée dans le fichier de résultats.");
                  console.info("No transcription results found in the API output file.");
                }
              } catch (fetchError: any) {
                console.error("Error fetching or parsing transcription JSON from GCS:", fetchError);
                setError("Impossible de charger ou d'analyser le fichier de transcription.");
                setFetchedTranscriptionText(data.transcription || "Erreur lors du chargement du texte.");
              } finally {
                setIsFetchingJson(false);
              }
            }
          } else { // Completed, but no JSON path
            setFetchedTranscriptionText(data.transcription || "");
            fetchedPathRef.current = null;
          }
        } else if (newStatus === "error" || newStatus === "error_unsupported_type") {
          setError(data.errorMessage || (newStatus === "error_unsupported_type" ? "Type de fichier non supporté." : "Erreur lors du traitement."));
          setFetchedTranscriptionText(data.transcription || null);
          fetchedPathRef.current = null;
        } else if (newStatus === "processing") {
          // If status changes to processing, clear old text/path
          if (fetchedTranscriptionText !== null) setFetchedTranscriptionText(null);
          if (fetchedPathRef.current !== null) fetchedPathRef.current = null;
        } else {
          // Unknown status
          setFetchedTranscriptionText(null);
          fetchedPathRef.current = null;
          setError("Statut de transcription inconnu ou invalide.");
          setCurrentStatus("error"); // Force error status
        }
      } else {
        setError("Document de transcription non trouvé. Il est possible qu'il soit encore en cours de création ou que l'ID soit incorrect.");
        setCurrentStatus("error");
        setTranscriptionDocData(null);
        setFetchedTranscriptionText(null);
        fetchedPathRef.current = null;
      }
    }, (err) => {
      console.error("Error listening to transcription document:", err);
      setError("Erreur de connexion au suivi de la transcription.");
      setCurrentStatus("error");
      setTranscriptionDocData(null);
      setFetchedTranscriptionText(null);
      fetchedPathRef.current = null;
    });

    // Cleanup listener on component unmount or user change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user]); // Effect only depends on user

  return (
    <Box p={5} maxW="3/4" mx="auto" boxShadow="md">
      <VStack align="start">

        <Heading size="lg">Transcription de l&apos;enregistrement</Heading>

        {(currentStatus === "processing" || (currentStatus === "completed" && isFetchingJson)) && (
          <Alert.Root status="info" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px">
            <Alert.Indicator asChild>
              <Spinner size="xl" />
            </Alert.Indicator>
            <Alert.Content mt={4}>
              <Alert.Title mb={1} fontSize="lg">
                {currentStatus === "completed" && isFetchingJson ? "Chargement de la transcription..." : "Traitement en cours..."}
              </Alert.Title>
              <Alert.Description maxWidth="sm">
                {currentStatus === "completed" && isFetchingJson ? "Récupération et analyse du fichier de transcription." : "Votre transcription est en cours de préparation. Cela peut prendre quelques instants."}
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {currentStatus === "error" && error && (
          <Alert.Root status="error">
            <Alert.Indicator /> {/* Default Chakra icon or your custom one */}
            <Alert.Content>
              <Alert.Title>Erreur de Transcription!</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
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
            Vous êtes professeur principal d&apos;une classe de 3ème, vous devez organiser l&apos;élection des délégués de classe. Personne ne propose sa candidature.
          </Text>
          <Text mt={2}>
            Comment analysez-vous cette situation et quelles solutions envisagez-vous ?
          </Text>
        </Box>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">Délégués :</Text> représentants de la classe</Text>
          <Text><Text fontWeight="bold" as="span">Classe de 3</Text><Text fontWeight="bold" as="span">ème</Text> : pas nouveau pour eux, déjà eux l’expérience de la fonction de délégué. Validation du S4C fin en cycle 4. Brevet.</Text>
          <Text><Text fontWeight="bold" as="span">Doit organiser</Text> : obligation d&apos;avoir élu les délégués avant la 7ème semaine après la rentrée</Text>
          <Text><Text fontWeight="bold" as="span">Prof Principal</Text> : réalise les heures de vie de classe, responsable de l&apos;élection de délégués</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Hypothèses explicatives découlant des définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">H1 :</Text> les élèves pensent qu&apos;ils ne servent à rien, ou à faire des tâches secondaires (distribuer les papiers, effacer le tableau…) / mauvaise expérience les années précédentes.</Text>
          <Text><Text fontWeight="bold" as="span">H2 :</Text> stress d&apos;exercer des responsabilités / penser être incompétent pour la tâche</Text>
          <Text><Text fontWeight="bold" as="span">H3 :</Text> Charge de travail trop importante étant donné qu&apos;il s&apos;agit de l&apos;année du brevet et d&apos;un premier choix d&apos;orientation</Text>
          <Text><Text fontWeight="bold" as="span">H4 :</Text> mauvais climat de classe qui engendre la peur de se présenter devant les autres ou de proposer sa candidature</Text>
          <Text>Nous retiendrons prioritairement la première hypothèse (H1), étant donné la précision de la classe de 3ème dans le sujet.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Valeurs de la république soulevées</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Prioritaires (pour H1) :</Text>
          <Text>Citoyenneté</Text>
          <Text>Démocratie</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Secondaires :</Text>
          <Text>Climat scolaire</Text>
          <Text>Vivre-ensemble</Text>
          <Text>Réussite scolaire</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Dilemme de l’enseignant</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>Montrer l’importance de la fonction pour convaincre et avoir des candidats alors que le rôle est parfois réduit à des tâches sans grand intérêt.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Éléments de réponses</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Court terme :</Text>
          <Text>Brainstorming : pour savoir pourquoi ils ne veulent pas être délégués et ce qu’ils pensent être le rôle de ce dernier. Clarifier son rôle.</Text>
          <Text>Expliquer l’importance d’avoir un représentant et les conséquences s’il n’y en a pas.</Text>
          <Text>Montrer la plus-value personnel : avantage sur CV, validation des éléments du S4C pris en compte dans le brevet, confiance en soi, capacités à l’oral.</Text>
          <Text>Présenter les différents délégués : délégué de classe, éco-délégué.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Moyen terme :</Text>
          <Text>Avec le CPE : sélectionner les anciens délégués qui ont eu des expériences positives et les faire intervenir dans les classes</Text>
          <Text>Créer une formation « d&apos;apprenti délégué » interne qui peut consister en petits ateliers pour apprendre à s&apos;exprimer, savoir écouter les demandes et les restituer (prise de notes), ne pas avoir de jugement et savoir garder les infos pour soi, présentation d&apos;outils, simulation de conseil de classe. Possibilité de faire appel à d’autres acteurs (Fédération Aroéven, SEMEA).</Text>
          <Text>Valoriser les actions des délégués dans le Parcours Citoyen.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Long terme :</Text>
          <Text>La 6ème semaine après la rentrée, organiser la semaine de la démocratie scolaire pour proposer des actions en lien avec cette valeur. A organiser avec le CA.</Text>
          <Text>Développer différentes responsabilités à l’échelle de l’établissement (exemple : tutorat 3è- 6è).</Text>
          <Text>Anticiper l&apos;élection : sacraliser l&apos;élection à l&apos;échelle de l&apos;établissement : campagne de présentation, urne et isoloir. Proposer l&apos;action au CA de début d&apos;année.</Text>
          <Text>Intervention d’un maire, pour une conférence sur la démocratie.</Text>
        </List.Root>
      </VStack>
    </Box>
  );
};
