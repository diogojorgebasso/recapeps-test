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
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
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
  const [isFetchingText, setIsFetchingText] = useState(false);

  useEffect(() => {
    if (!user) {
      if (user === null) {
        setError("Utilisateur non connecté ou ID de transcription manquant.");
      }
      setCurrentStatus("error");
      return;
    }

    // Clean up previous listener if user or transcriptionId changes
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    setFetchedTranscriptionText(null); // Reset fetched text when ID changes
    setIsFetchingText(false);

    const transcriptDocRef = doc(db, "users", user.uid, "transcripts", "addiction");

    unsubscribeRef.current = onSnapshot(transcriptDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as TranscriptionData;
        setTranscriptionDocData(data);
        setCurrentStatus(data.status || "processing");
        setError(null);

        if (data.status === "completed" && data.transcriptionJsonPath) {
          if (!fetchedTranscriptionText && !isFetchingText) {
            setIsFetchingText(true);
            try {
              let pathInBucket = data.transcriptionJsonPath; // Use transcriptionJsonPath
              // If pathInBucket is already relative (e.g., "user/.../...json"), this block is skipped.
              if (pathInBucket.startsWith("gs://")) {
                pathInBucket = pathInBucket.substring(pathInBucket.indexOf('/', 5) + 1);
              }

              const fileRef = storageRef(storage, pathInBucket);
              const blob = await getBlob(fileRef);
              const jsonText = await blob.text();
              const speechApiOutput = JSON.parse(jsonText) as SpeechApiResponse;

              if (speechApiOutput.results && speechApiOutput.results.length > 0) {
                const combinedTranscript = speechApiOutput.results
                  .map(result => {
                    const alternative = result.alternatives && result.alternatives[0];
                    return alternative && alternative.transcript ? alternative.transcript.trim() : "";
                  })
                  .join(" ")
                  .replace(/\.\s+/g, ".\n\n")
                  .replace(/\?\s+/g, "?\n\n")
                  .replace(/!\s+/g, "!\n\n")
                  .trim();
                setFetchedTranscriptionText(combinedTranscript);
              } else {
                setFetchedTranscriptionText("Aucune transcription trouvée dans le fichier de résultats.");
                console.info("No transcription results found in the API output file."); // Changed info to console.info
              }

            } catch (fetchError: any) {
              console.error("Error fetching or parsing transcription JSON from GCS:", fetchError);
              setError("Impossible de charger ou d'analyser le fichier de transcription.");
              // Fallback to direct transcription field if it exists (e.g., for older error messages)
              setFetchedTranscriptionText(data.transcription || "Erreur lors du chargement du texte.");
            } finally {
              setIsFetchingText(false);
            }
          }
        } else if (data.status === "completed" && !data.transcriptionJsonPath) { // Use transcriptionJsonPath
          setFetchedTranscriptionText(data.transcription || ""); // E.g. empty audio resulted in empty transcription
        } else if (data.status === "error" || data.status === "error_unsupported_type") {
          setError(data.errorMessage || (data.status === "error_unsupported_type" ? "Type de fichier non supporté." : "Erreur lors du traitement."));
          // If there's an error, the 'transcription' field in Firestore might hold the error message from the function
          setFetchedTranscriptionText(data.transcription || null);
        }
      } else {
        setError("Document de transcription non trouvé. Il est possible qu'il soit encore en cours de création ou que l'ID soit incorrect.");
        setCurrentStatus("error"); // Or keep 'processing' and show a specific message
        setTranscriptionDocData(null);
      }
    }, (err) => {
      console.error("Error listening to transcription document:", err);
      setError("Erreur de connexion au suivi de la transcription.");
      setCurrentStatus("error");
      setTranscriptionDocData(null);
    });

    // Cleanup listener on component unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user, fetchedTranscriptionText, isFetchingText]);

  return (
    <Box p={5} maxW="3/4" mx="auto" boxShadow="md">
      <VStack align="start" gap={4}>

        <Heading size="lg">Transcription de l&apos;enregistrement</Heading>

        {(currentStatus === "processing" || (currentStatus === "completed" && isFetchingText)) && (
          <Alert.Root status="info" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px">
            <Alert.Indicator asChild>
              <Spinner size="xl" />
            </Alert.Indicator>
            <Alert.Content mt={4}>
              <Alert.Title mb={1} fontSize="lg">
                {currentStatus === "completed" && isFetchingText ? "Chargement de la transcription..." : "Traitement en cours..."}
              </Alert.Title>
              <Alert.Description maxWidth="sm">
                {currentStatus === "completed" && isFetchingText ? "Récupération et analyse du fichier de transcription." : "Votre transcription est en cours de préparation. Cela peut prendre quelques instants."}
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
        {currentStatus === "error_unsupported_type" && (
          <Alert.Root status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Type de fichier non supporté</Alert.Title>
              <Alert.Description>La transcription n&apos;a pas pu être effectuée pour ce fichier.</Alert.Description>
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
            Vous êtes professeur(e) d’Éducation Physique et Sportive dans un collège rural. Lors d’un CA, est constaté l’addiction des élèves aux écrans avec des conséquences sur les apprentissages.</Text>
          <Text mt={2}>
            Comment analysez-vous cette situation et quelles solutions envisagez-vous ?

          </Text>
        </Box>

        {currentStatus === "completed" && transcriptionDocData && fetchedTranscriptionText !== null ? (
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
          currentStatus !== "processing" && !(currentStatus === "completed" && isFetchingText) && currentStatus !== "error" && currentStatus !== "error_unsupported_type" && (
            <Text color="gray.500" fontStyle="italic">
              Aucune transcription disponible ou en attente de traitement.
            </Text>
          )
        )}

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

