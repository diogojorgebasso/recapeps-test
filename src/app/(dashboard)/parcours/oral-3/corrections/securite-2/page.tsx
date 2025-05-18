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

    const transcriptDocRef = doc(db, "users", user.uid, "transcripts", "securite-2");

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
          <Text fontWeight="bold">Sujet disciplinaire</Text>
          <Text mt={4}>
            Vous êtes enseignant d&apos;EPS dans un lycée de centre-ville. Lors d&apos;un cours de natation, vous constatez qu&apos;un élève a de nombreuses ecchymoses et qu&apos;il se scarifie.
          </Text>
          <Text mt={2}>
            Comment analysez-vous cette situation et quelles solutions envisagez-vous ?
          </Text>
        </Box>

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
          <Heading size="md">Définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>
            <Text fontWeight="bold" as="span">Natation</Text> : tenue laissant dévoiler certaines parties du corps non visibles habituellement (par les autres élèves, enseignants…).
          </Text>
          <Text>
            <Text fontWeight="bold" as="span">Nombreuses ecchymoses</Text> : symboles de violence physique.
          </Text>
          <Text>
            <Text fontWeight="bold" as="span">Scarifie</Text> : violence infligée à soi-même pour combattre des souffrances psychiques.
          </Text>
          <Text>
            <Text fontWeight="bold" as="span">Lycée</Text> : peut caractériser une période de mal-être chez les adolescents.
          </Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md">Hypothèses explicatives découlant des définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>
            <Text fontWeight="bold" as="span">H1 :</Text> l&apos;élève subit des violences physiques à l&apos;école ou à la maison.
          </Text>
          <Text>
            <Text fontWeight="bold" as="span">H2 :</Text> l&apos;élève traverse une période de mal-être profond qui l&apos;amène à se faire violence lui-même.
          </Text>
          <Text>
            <Text fontWeight="bold" as="span">H3 :</Text> L&apos;élève a besoin de faire remarquer physiquement un mal-être dont il n&apos;arrive pas à parler et attend qu&apos;on lui tende la main.
          </Text>
          <Text>Nous retiendrons prioritairement la première hypothèse (H1).</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md">Valeurs de la république soulevées</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Prioritaires (pour H1) :</Text>
          <Text>Sécurité</Text>
          <Text>Santé</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Secondaires :</Text>
          <Text>Intégrité</Text>
          <Text>Solidarité</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md">Dilemme de l&apos;enseignant</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>
            L&apos;enseignant doit réagir et agir sans pour autant aggraver le mal-être de l&apos;élève, ni entrer dans son espace confidentiel s&apos;il ne le souhaite pas.
          </Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md">Éléments de réponses</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Court terme :</Text>
          <Text>Ne pas se précipiter directement et devant les autres élèves : laisser dérouler la leçon et agir normalement avec l&apos;ensemble des élèves.</Text>
          <Text>Prendre l&apos;élève à part et discrètement en fin de leçon afin d&apos;essayer d&apos;engager une discussion</Text>
          <Text>
            Si l&apos;élève coopère : communiquer de façon bienveillante, écouter et poser des questions si on voit que l&apos;élève a besoin d&apos;en parler, et si on se sent apte à le faire.
          </Text>
          <Text>
            Si l&apos;élève se braque : ne pas insister, mais proposer son écoute à un autre moment s&apos;il le souhaite.
          </Text>
          <Text>
            Dans tous les cas : informer l&apos;élève (et si possible au début de l&apos;échange) que je vais relayer les informations afin qu&apos;il puisse être aidé au mieux. Lui donner des contacts utiles : psyEN, 31 14 numéro national de prévention du suicide.
          </Text>
          <Text>
            Dès la fin de la leçon : prendre contact avec la direction du collège pour transmettre les informations vues, ou communiquées par l&apos;élève.
          </Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Moyen terme :</Text>
          <Text>
            S&apos;il s&apos;avère que les violences sont internes à l&apos;école : mise en place du programme pHARe, se mettre en lien avec les référents académiques. Sanctions disciplinaires pour les agresseurs en cas de violences physiques (ecchymoses).
          </Text>
          <Text>
            S&apos;il s&apos;avère que les violences sont externes à l&apos;école (famille) : l&apos;enseignant ou la direction (ou les deux ensemble) effectue un signalement (priorité !), par téléphone ou en ligne.
          </Text>
          <Text>Le numéro 119 peut aider dans les démarches concernant l&apos;enfance en danger.</Text>
          <Text>Assurer un suivi de l&apos;élève par la psyEN, ou par un adulte de l&apos;école à qui l&apos;élève se confie aisément.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Long terme (cf. fiche « solution à long terme » pour plus de détail sur ces actions) :</Text>
          <Text>Demander une formation à l&apos;échelle de l&apos;établissement sur le repérage des « enfants en danger » et les conduites à tenir.</Text>
          <Text>Prévention lors de la Journée internationale des droits de l&apos;enfant.</Text>
        </List.Root>
      </VStack>
    </Box>
  );
};
