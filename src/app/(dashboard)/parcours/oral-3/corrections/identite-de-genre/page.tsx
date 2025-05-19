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

    const transcriptDocRef = doc(db, "users", user.uid, "transcripts", "identite-de-genre");

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
            Vous êtes professeur(e) d’Éducation Physique et Sportive dans un lycée général de centre-ville. Une élève en transition vous demande en cours d’année la possibilité de se changer dans les vestiaires des garçons.        </Text>
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
          <Heading size="md" >Définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">Lycée général</Text> :  fin d’adolescence.</Text>
          <Text><Text fontWeight="bold" as="span">Centre-ville</Text> : élèves pouvant être assez au fait et ouverts sur les questions de genre.</Text>
          <Text>Une élève en transition : fille en transition pour être garçon. Changement de genre / sexe.</Text>
          <Text><Text fontWeight="bold" as="span">En cours d’année</Text> : demande qui va impacter l’organisation mise en place depuis le début d’année. Changement visible pour les élèves.</Text>
          <Text><Text fontWeight="bold" as="span">Vestiaire</Text> : lieu où les élèves se changent. Lieu ou la sécurité affective de tous doit être assurée.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Hypothèses explicatives découlant des définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">H1 :</Text> l’élève avance dans sa transition et ne sent plus à l’aise de se changer dans les vestiaires ne correspondant plus à son genre.</Text>
          <Text><Text fontWeight="bold" as="span">H2 :</Text> l’élève assume sa transition et ose faire cette demande auprès du professeur.</Text>
          <Text><Text fontWeight="bold" as="span">H3 :</Text> les filles de la classe ne veulent plus que cet(te) élève se change dans les vestiaire car elle transitionne pour être garçon.</Text>
          <Text><Text fontWeight="bold" as="span">H4 :</Text> certains garçons ont mis la pression à cette fille pour qu’elle se change avec eux sous prétexte qu’elle ne serait pas un « vrai garçon » sinon.</Text>
          <Text>Nous retiendrons prioritairement la première hypothèse (H1), mais les autres ne sont pas à négliger, et nécessitent d’être tout de même intégrée à la réponse.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Valeurs de la république soulevées</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Prioritaires (pour H1) :</Text>
          <Text>Identité de genre</Text>
          <Text>Sécurité affective</Text>
          <Text>Santé mentale</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Secondaires :</Text>
          <Text>Tolérance</Text>
          <Text>Bienveillance</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Dilemme de l’enseignant</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>Réussir à assurer la sécurité affective de cette élève, sans compromettre celle des autres élèves de la classe qui seront forcément impacté de la situation.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Éléments de réponses</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Court terme :</Text>
          <Text>Engager le dialogue avec l’élève. Si elle formule cette demande, nous estimons qu’elle est à l’aise d’en parler. Si ce n’est pas le cas, ne pas insister.</Text>
          <Text>Lui expliquer que ce n’est pas une décision qui peut se faire aussi spontanément. Les vestiaires à l’école sont non mixtes et nous devons nous tenir au sexe officiel de l’élève. Ici, l’élève est « en transition », nous ne savons pas si son sexe est déjà changé officiellement (documents d’identité).</Text>
          <Text>De plus, expliquer l’impact que cela peut avoir sur les autres, ainsi que sur elle. Sans explication ou prévention à la classe, le risque serait d’être rejetée, dévisagée ou insultée dans les vestiaires des garçons. De même qu’il faut assurer sa sécurité, il faut assurer celle des autres.</Text>
          <Text>Rediriger l’élève vers l’infirmier ou la psyEN, qui pourront avoir davantage d’informations « confidentielles » telles que l’avancée de la transition, le genre et sexe officiel…et ainsi aider dans la décision.</Text>
          <Text>Savoir si la demande est due à un mal être ou à une simple préférence (cela peut changer les solutions mises en œuvre).</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Moyen terme :</Text>
          <Text>Faire remonter l’information à la direction, et se réunir avec celle-ci et la psyEN, infirmier afin de réfléchir à une solution.</Text>
          <Text>Proposer une solution à l’élève pour se changer à part si elle exprime un mal-être : se changer dans un autre vestiaire, dans les toilettes, un peu après tout le monde, venir déjà habillée…</Text>
          <Text>Faire un sondage anonyme auprès des élèves de la classe sur des questions de genre / sexe / orientations, sans citer la personne, et y glisser la question des vestiaires pour avoir une vision d’ensemble de la classe.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Long terme (cf. fiche « solution à long terme » pour plus de détail sur ces actions) :</Text>
          <Text>Organiser des actions d’informations / prévention lors de la Journée internationale de la visibilité transgenre le 31 mars.</Text>
          <Text>Si l’école en lien avec le médecin de l’élève décide qu’il est possible pour elle de changer de vestiaire, après en avoir discuté avec les élèves, réaliser une lettre d’information à faire signer par les élèves de la classe et leur parents, avec la possibilité de prendre contact avec l’enseignant en cas de question / doute / refus.</Text>
        </List.Root>
      </VStack>
    </Box>
  );
};
