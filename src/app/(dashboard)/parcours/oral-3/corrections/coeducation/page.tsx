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

    const transcriptDocRef = doc(db, "users", user.uid, "transcripts", "coeducation");

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
          <Text fontWeight="bold">Sujet vie scolaire</Text>
          <Text mt={4}>
            Vous êtes enseignant d’EPS dans un collège REP +. Il apparaît que peu de parents viennent à la réunion de rentrée présentant l’année de 6ème. Le chef d’établissement sollicite l’équipe éducative et pédagogique afin de développer des liens permettant une réelle co-éducation.
          </Text>
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
          <Text><Text fontWeight="bold" as="span">Collège</Text><Text fontWeight="bold" as="span"> REP+</Text> : Accueille des élèves issus de famille rencontrant des difficultés sociales, parents de CSP défavorisés ; difficultés scolaires fréquentes.</Text>
          <Text><Text fontWeight="bold" as="span">Réunion de pré-rentrée 6</Text><Text fontWeight="bold" as="span">ème</Text> : Entrée au collège, moment important pour la suite de la scolarité ; Présentation d’informations importantes, fonctionnement, nouveautés.</Text>
          <Text><Text fontWeight="bold" as="span">Chef d’établissement et équipe éducative</Text> : personnels qui vont assurer la scolarité et le suivi durant les quatre années collège.</Text>
          <Text><Text fontWeight="bold" as="span">Développer des liens permettant une réelle co-éducation</Text> : « Relation entre éducateurs dits « premiers », que sont les parents, et éducateurs professionnels qui œuvrent en parallèle » (Rayna & Rubio, 2010)</Text>
          <Text>Augmenter les liens = rencontres, suivi par médias, donner la parole… faire en sorte que les parents s’impliquent dans la scolarité de leur enfants.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Hypothèses explicatives découlant des définitions</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text><Text fontWeight="bold" as="span">H1 :</Text><Text fontWeight="bold" as="span"> Manque de capacité</Text> : ne comprennent pas le fonctionnement des rencontres, ne sont pas disponibles aux horaires de réunions, ne maitrisent pas suffisamment la langue française pour pouvoir échanger, ne savent pas à qui s’adresser en cas de problème…</Text>
          <Text><Text fontWeight="bold" as="span">H2 : Ne réalisent pas l’importance de leur rôle</Text> : reconnaissent la compétence des enseignants et ont confiance en eux, pensent que c’est la scolarité de leur enfant résulte de leur entière responsabilité</Text>
          <Text><Text fontWeight="bold" as="span">H3 : Sentiment d’impuissance</Text> : sont conscient des difficultés de leur enfants et des inégalités de l’école, et tentent de se retirer de tout ça pour préserver leur dignité</Text>
          <Text>Nous répondrons en traitant l’ensemble des hypothèses qui représentent toutes un frein à la co-éducation. De plus, un grand nombre de parents étant absent, des raisons diverses sont assurément en cause.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Valeurs de la république soulevées</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Prioritaires :</Text>
          <Text>Coéducation</Text>
          <Text>Coopération</Text>
          <Text>Collaboration</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Secondaires :</Text>
          <Text>Réussite</Text>
          <Text>Confiance</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Dilemme de l’enseignant</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text>Je dois réussir à tisser des liens entre les parents et l’école, alors que ces derniers semblent démissionnaires dès la première rentrée de collège, et ainsi que le contact risque d’être compliqué à établir s’ils ne sont jamais présents.</Text>
        </List.Root>
        <Box bg="teal.500" p="3" borderRadius="lg" w="full">
          <Heading size="md" >Éléments de réponses</Heading>
        </Box>
        <List.Root gap={2} pl={4}>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">A l’échelle de ma discipline</Text>
          <Text>Un projet de remise en forme parents-enfants</Text>
          <Text>Une fois par semaine, invitation des élèves et parents volontaires à un cours de remise en forme  permet d’échanger avec les familles de manière informelle</Text>
          <Text>Aucune compétence n’est attendue de la part des parents</Text>
          <Text>Créer une dynamise d’établissement et permet de faire venir les parents dans le collège.</Text>
          <Text>Permet de proposer une première forme d’accompagnement des parents, sans nécessiter de compétence particulière, mais pour favoriser un sentiment d’appartenance et de considération  seront surement plus aptes à venir discuter, à s’intéresser à ce qu’il se passe dans l’établissement et à la scolarité de leurs enfants.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Sur le moyen terme</Text>
          <Text>Utiliser la « Malette des parents » qui est un outil reposant sur 3 moments clefs de la scolarité : CP, 6ème et 3ème. Ici, on est sur un des moments clefs puisqu’on se trouve en 6ème. Le principe est de faire comprendre aux parents le SS et le déroulement des apprentissages, à travers notamment des ateliers débats.</Text>
          <Text fontWeight="bold" textDecoration="underline" mt="4" mb="2">Au niveau transversal</Text>
          <Text>Inscrire la coéducation comme un axe du projet d’établissement, et proposer un dispositif de soutien à la parentalité afin de pouvoir le mettre en œuvre. Par exemple le CLAS, dispositif essentiellement centré sur l’aide aux devoirs, mais aussi encouragement à la lecture (fréquentation des médiathèques) ; Implication des parents sollicitée par contractualisation écrite ou orale (élaboration d’outils de liaison, organisation de rencontres…).</Text>
          <Text>OEPRE « ouvrir l’école aux parents pour la réussite des enfants ».</Text>
        </List.Root>
      </VStack>
    </Box>
  );
};
