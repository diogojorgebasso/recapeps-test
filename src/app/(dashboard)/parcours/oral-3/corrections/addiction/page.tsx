"use client";

import { Box, Heading, Text, VStack, List, Spinner, Alert } from "@chakra-ui/react"; // Keep existing imports for now, Alert might be from a different import if it's a custom component
import { useEffect, useState, useRef } from "react";
import { useUserWithClaims } from "@/lib/getUser";
import { TranscriptionData, TranscriptionStatus } from "@/types/Transcript";
import { useSearchParams } from 'next/navigation';
import { db, storage } from "@/lib/firebase/clientApp"; // Import clientStorage
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { ref as storageRef, getBlob } from "firebase/storage"; // For fetching from GCS
import { toaster } from "@/components/ui/toaster";

export default function Page() {
  const [transcriptionDocData, setTranscriptionDocData] = useState<TranscriptionData | null>(null);
  const [fetchedTranscriptionText, setFetchedTranscriptionText] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<TranscriptionStatus>("processing"); // Start with processing
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const transcriptionIdFromQuery = searchParams.get('transcriptionId'); // This should be the 'theme'

  const { user } = useUserWithClaims();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const [isFetchingText, setIsFetchingText] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  useEffect(() => {
    // Ensure user and transcriptionId (theme) are available
    if (!user || !transcriptionIdFromQuery) {
      if (user === null && !transcriptionIdFromQuery) {
        setError("Utilisateur non connecté ou ID de transcription manquant.");
      } else if (user === null) {
        setError("Utilisateur non connecté.");
      } else if (!transcriptionIdFromQuery) {
        setError("ID de transcription manquant dans l'URL.");
      } else {
        // User is undefined (still loading), wait for user object
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

    const transcriptDocRef = doc(db, "users", user.uid, "transcripts", transcriptionIdFromQuery);

    unsubscribeRef.current = onSnapshot(transcriptDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as TranscriptionData;
        setTranscriptionDocData(data);
        setCurrentStatus(data.status || "processing");
        setError(null);

        if (data.status === "completed" && data.transcriptionPath) {
          if (!fetchedTranscriptionText && !isFetchingText) { // Fetch only if not already fetched or fetching
            setIsFetchingText(true);
            try {
              // Assuming data.transcriptionPath is the full gs:// URI, extract the path part.
              // Or if your backend stores just the path, adjust accordingly.
              let pathInBucket = data.transcriptionPath;
              if (pathInBucket.startsWith("gs://")) {
                pathInBucket = pathInBucket.substring(pathInBucket.indexOf('/', 5) + 1); // Remove gs://bucket-name/
              }

              const fileRef = storageRef(storage, pathInBucket);
              // const downloadUrl = await getDownloadURL(fileRef); // Option 1: Get URL and fetch
              // const response = await fetch(downloadUrl);
              // const text = await response.text();
              // setFetchedTranscriptionText(text);

              // Option 2: Get Blob and read as text (more direct with Firebase SDK)
              const blob = await getBlob(fileRef);
              const text = await blob.text();
              setFetchedTranscriptionText(text);

            } catch (fetchError: any) {
              console.error("Error fetching transcription text from GCS:", fetchError);
              setError("Impossible de charger le texte de la transcription depuis le stockage.");
              toaster.create({ title: "Erreur de chargement", description: "Le texte de la transcription n'a pas pu être récupéré.", type: "error" });
              setFetchedTranscriptionText(data.transcription || "Erreur lors du chargement du texte."); // Fallback if direct transcription was stored
            } finally {
              setIsFetchingText(false);
            }
          }
        } else if (data.status === "completed" && !data.transcriptionPath) {
          // Completed, but no transcription path (e.g., empty audio or no speech detected)
          setFetchedTranscriptionText(data.transcription || ""); // Use direct transcription if available (e.g. empty string)
        } else if (data.status === "error" || data.status === "error_unsupported_type") {
          setError(data.errorMessage || (data.status === "error_unsupported_type" ? "Type de fichier non supporté." : "Erreur lors du traitement."));
          setFetchedTranscriptionText(data.transcription || null); // Display error message from transcription field if present
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
      toaster.create({ title: "Erreur de Suivi", description: "Impossible de suivre l'état de la transcription.", type: "error" });
    });

    // Cleanup listener on component unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user, transcriptionIdFromQuery, fetchedTranscriptionText, isFetchingText]); // Add dependencies

  return (
    <Box p={5} maxW="3/4" mx="auto" boxShadow="md">
      <VStack align="start" gap={4}>

        <Heading size="lg">Transcription de l&apos;enregistrement (Thème: {transcriptionIdFromQuery || 'N/A'})</Heading>

        {(currentStatus === "processing" || (currentStatus === "completed" && isFetchingText)) && (
          <Alert.Root status="info" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px">
            <Alert.Indicator asChild>
              <Spinner size="xl" />
            </Alert.Indicator>
            <Alert.Content mt={4}> {/* Added mt={4} to Alert.Content for spacing similar to previous AlertTitle */}
              <Alert.Title mb={1} fontSize="lg">
                {currentStatus === "completed" && isFetchingText ? "Chargement du texte..." : "Traitement en cours..."}
              </Alert.Title>
              <Alert.Description maxWidth="sm">
                {currentStatus === "completed" && isFetchingText ? "Récupération du texte de la transcription." : "Votre transcription est en cours de préparation. Cela peut prendre quelques instants."}
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
            <Alert.Indicator /> {/* Default Chakra icon or your custom one */}
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
            <Text fontWeight="bold">Fichier: {transcriptionDocData.fileName}</Text>
            <Text fontSize="sm" color="gray.500">
              Taille: {formatFileSize(transcriptionDocData.fileSize)} | Type: {transcriptionDocData.contentType}
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

