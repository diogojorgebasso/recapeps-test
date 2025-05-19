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

    const transcriptDocRef = doc(db, "users", user.uid, "transcripts", "egalite-2");

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
    <Box p={5} mx="auto" boxShadow="md">
      <VStack align="start">
        <Heading size="lg">Transcription de l&apos;enregistrement</Heading>

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
            Vous êtes professeur d&apos;EPS dans un collège, après avoir lu les résultats des filles et des garçons en EPS lors des dernières années, il s&apos;avère que la moyenne des garçons est supérieure à celle des filles d&apos;environ 2 points.        </Text>
          <Text mt={2}>
            Comment analysez-vous cette situation et quelles solutions envisagez-vous ?
          </Text>
        </Box>

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

        {currentStatus === "completed" && fetchedTranscriptionText !== null && !isFetchingJson && transcriptionDocData ? (
          <Box
            p={4}
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.200"
            fontSize="md"
            whiteSpace="pre-wrap"
            w="full"
          >
            <Text fontWeight="bold">Fichier Audio: {transcriptionDocData.fileName}</Text>
            <Text fontSize="sm" color="gray.500">
              Taille: {formatFileSize(transcriptionDocData.fileSize)} | Type: {transcriptionDocData.contentType || 'N/A'}
            </Text>
            <Text mt={2}>{fetchedTranscriptionText}</Text>
          </Box>
        ) : (
          currentStatus !== "processing" &&
          !(currentStatus === "completed" && isFetchingJson) &&
          currentStatus !== "error" &&
          currentStatus !== "error_unsupported_type" &&
          fetchedTranscriptionText === null && ( // Ensure text is null to show this message
            <Text color="gray.500" fontStyle="italic">
              Aucune transcription disponible ou en attente de traitement.
            </Text>
          )
        )}

        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">Professeur</Text><Text fontWeight="bold" as="span"> d’EPS</Text> : prend appui sur les pratiques sportives (peuvent être sources de stéréotypes) ; met en jeu le corps ; barèmes parfois différenciés ; utilisation de formes de groupement (mixité ?).</Text>
          <Text><Text fontWeight="bold" as="span">Collège</Text> : la mixité devient difficile et se renforce au fur et à mesure des années ; période de transformations corporelles et développement de nouvelles aptitudes motrices.</Text>
          <Text><Text fontWeight="bold" as="span">Des dernières années</Text> : récurrence.</Text>
          <Text><Text fontWeight="bold" as="span">2 points</Text> : écart significatif.</Text>
          <Text><Text fontWeight="bold" as="span">Les résultats </Text>: en général, pas seulement dans ma classe, cas généralisé au collège.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Hypothèses explicatives découlant des définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">H1 :</Text> La programmation est stéréotypée masculine, ce qui entraine plus de motivation chez les garçons (Cogérino, « Propos d’enseignant d’EP face à la mixité » , 2007).</Text>
          <Text><Text fontWeight="bold" as="span">H2 :</Text> Les élèves sont très conscients de ces connotations sexuées des pratiques (Fontayne, Sarrazin et Famose, 2001 ; Riemer et Visio, 2003 ; Wright, 1997) qui déterminent pour une part non négligeable leur envie de s’investir, leur motivation à l’égard des contenus d’enseignement.</Text>
          <Text><Text fontWeight="bold" as="span">H3 :</Text> les enseignants ne sont pas équitables dans la façon de noter les filles et les garçons.</Text>
          <Text><Text fontWeight="bold" as="span">H4 :</Text> les barèmes ne sont pas adaptés aux capacités des filles pour leur stade de développement moteur.</Text>
          <Text>Nous retiendrons l’ensemble des hypothèses, qui toutes font référence à des biais d’inégalités entre les filles et les garçons.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Valeurs de la république soulevées</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Prioritaires :</Text>
          <Text>Egalite</Text>
          <Text>Egalite des chances / de réussite</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Secondaires :</Text>
          <Text>Discrimination</Text>
          <Text>Esprit de justice</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Dilemme de l’enseignant</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>Résoudre le souci d’inégalité de réussite des filles et des garçons, sans rehausser simplement les notes ou aller dans de la discrimination positive.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Éléments de réponses</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Court terme :</Text>
          <Text>Regarder les notes de cette année pour voir si c&apos;est encore le cas ; regarder chez ses collègues enseignants d&apos;EPS pour voir si cela est généralisé à la discipline et regarder dans quelles matières c&apos;est également le cas. Se mettre en lien avec le professeur principal de chaque classe pour cela.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Moyen terme :</Text>
          <Text>Regarder les corrélations entre la programmation des activités et les notes des élèves (ex : filles meilleures notes en CA3 et pourtant on programme 80% de CA4  équitable ?)  En parler avec l&apos;équipe EPS et y réfléchir tous ensemble.</Text>
          <Text>Impliquer les élèves : faire un questionnaire anonyme mais dans lequel le sexe serait demandé, par rapport à la notation dans la discipline, mais aussi et surtout par rapport aux motivations des élèves (au niveau des APSA, des modes d’entrées, des questions libres pour exposer leur point de vue en général). (Lien avec équipe EPS).</Text>
          <Text>Discussion avec les élèves sur leurs représentations  but d’aller plus tard renverser les stéréotypes.</Text>
          <Text>Revoir le Projet EPS pour mettre au centre l’égalité des chances, la mixité…</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Long terme (cf. fiche « solution à long terme » pour plus de détail sur ces actions) :</Text>
          <Text>Revoir la programmation pour les années suivantes</Text>
          <Text>Adapter la notation pour qu’elle soit équitable si ce n’était pas le cas  aller vers une évaluation par compétences</Text>
          <Text>Trouver des modes d’entrée par le jeu ou le défi par exemple, dans les activités connotées pour emporter l’adhésion de certains ou limiter le refus des autres.</Text>
          <Text>Ex en gym : mode d’entrée par le défi ; mode d’entrée en double en badminton…</Text>
          <Text>Se référer aux référents égalité qui sont présents dans chaque établissement qui sont des relais pour lutter contre les stéréotypes  organiser une journée avec l&apos;équipe éducative où on se centrerais sur les stéréotypes pour les bousculer</Text>
          <Text>(journée égalité filles garçons le 8 mars)</Text>
          <Text>Proposer des créneaux UNSS non mixtes, ou avec des APSA correspondant davantage aux motivations des filles, afin de leur redonner confiance et les valoriser.</Text>
          <Text>Labellisation égalité filles-garçons.</Text>
          <Text>Mise en avant des femmes sportives dans le collège : à travers des affiches dans le gymnase (en lien avec professeur d&apos;Art-plastique.</Text>
        </List.Root>
      </VStack>
    </Box>
  );
};
