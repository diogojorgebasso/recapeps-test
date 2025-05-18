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

    const transcriptDocRef = doc(db, "users", user.uid, "transcripts", "cooperation");

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
            Vous êtes enseignant d&apos;EPS dans un collège de centre-ville, durant votre leçon de badminton, plusieurs élèves parmi les plus compétents refusent de coacher leur binôme plus en difficulté et se regroupent pour faire un match entre eux.
          </Text>
          <Text mt={2}>
            Comment analysez-vous cette situation et quelles solutions envisagez-vous ?
          </Text>
        </Box>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">Centre-ville</Text> : ressources à disposition, plutôt scolaires, visent la réussite, peuvent être davantage individualiste pour être les meilleurs.</Text>
          <Text><Text fontWeight="bold" as="span">Badminton</Text> : les AFC 3 et 4 affirment la nécessité d’être « solidaires de ses partenaires », d’« observer et co-arbitrer ».</Text>
          <Text><Text fontWeight="bold" as="span">Plusieurs élèves</Text> : ils ont peut-être le même motif d’agir, ou alors nous avons un meneur et des suiveurs.</Text>
          <Text><Text fontWeight="bold" as="span">Plus compétents / plus en difficulté</Text> : différence de niveau moteur.</Text>
          <Text><Text fontWeight="bold" as="span">Se regroupent pour faire un match</Text> : privilégient le but de performance, le versant moteur, la comparaison sociale.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Hypothèses explicatives découlant des définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">H1</Text> : les élèves ne trouvent pas de sens dans les rôles sociaux, et préfèrent le versant moteur d’autant plus qu’ils se sentent compétents dans celui-ci.</Text>
          <Text><Text fontWeight="bold" as="span">H2</Text> : les élèves sont individualistes et ne veulent pas coopérer.</Text>
          <Text><Text fontWeight="bold" as="span">H3</Text> : les élèves compétents se considèrent supérieurs aux autres et libres de faire ce qui leur plait.</Text>
          <Text><Text fontWeight="bold" as="span">H4</Text> : Les élèves ne se sentent pas compétents dans le rôle de coach et se réfugient dans ce qu’ils maitrisent.</Text>
          <Text>Nous retiendrons prioritairement l’ensemble des hypothèses qui se rattachent aux mêmes valeurs.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Valeurs de la république soulevées</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Prioritaires :</Text>
          <Text>Coopération</Text>
          <Text>Fraternité</Text>
          <Text>Solidarité</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Dilemme de l’enseignant</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>Donner de l’attrait (sens / sentiment de compétence / valorisation) pour le rôle de coach alors que les élèves souhaitent pratiquer / sont individualiste.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Éléments de réponses</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Court terme :</Text>
          <Text>Arrêter le match en cours et rappeler à l’ordre les élèves quant à leur tâche de travail. Faire un rassemblement collectif pour ré expliquer le rôle du coach et les attendus.</Text>
          <Text>Créer communauté d’intérêt entre élèves (Galichet, 1998) grâce à la ronde italienne par exemple (équipes de deux joueurs. Le moins compétent au niveau moteur commence le match, coaché par le plus compétent. Lorsque le premier arrive à 10 points, les plus compétents prennent le relais sur le terrain, en gardant le score des deux joueurs moins compétents) solidarité, sens au coaching, responsabilité</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Moyen terme :</Text>
          <Text>Systématiser les rôles sociaux dans l’ensemble des situations et des APSA. Les clarifier et les formaliser à l’échelle de l’équipe EPS pour avoir une véritable continuité et du sens pour les élèves.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Long terme (cf. fiche « solution à long terme » pour plus de détail sur ces actions) :</Text>
          <Text>Développer la pédagogie coopérative au sein de l’équipe pédagogique : tutorat entre élèves dans les travaux de groupe, AP, TPE (au lycée)</Text>
          <Text>Autogestion de la classe (article Julien CONTU – Revue enseigner l’EPS n°283 – janvier 2021 – AEEPS)</Text>
          <Text>Mise en avant des compétences psychosociales en ayant formé les enseignants d&apos;un établissement (FIL : formation d&apos;initiative locale) : « savoir communiquer efficacement » ; « être habile dans les relations interpersonnelles » ; « avoir de l&apos;empathie et savoir gérer ses émotions »</Text>
          <Text>EPI autour du vivre-ensemble (EPS/EMC) avec la citoyenneté/fraternité en acte à travers partage des tâches, respect des règles, prise en compte des individualité (raid nature avec chaque jour un groupe responsable du repas / vaisselle / veillée…)</Text>
        </List.Root>
      </VStack>
    </Box>
  );
};
