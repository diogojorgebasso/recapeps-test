"use client"

import React, { useState, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
    Avatar,
    Box,
    Button,
    Fieldset,
    Flex,
    Heading,
    HStack,
    Input,
    Text,
    VStack,
    Checkbox,
    Dialog,
    Field,
    FileUpload
} from "@chakra-ui/react";

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import { Toaster, toaster } from "@/components/ui/toaster"
import { HiUpload } from "react-icons/hi";
import { PasswordInput } from "@/components/ui/password-input";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/clientApp";
import Link from "next/link";
import { useAuth } from "@/contexts/Auth/useAuth";
import { handleEmailChange, updateUserName } from "./actions";
import EmailNotificationToggle from "./EmailNotificationToggle";

export default function Profil() {

    const { user, updatePhotoURLInContext, pro } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false)
    const [newEmail, setNewEmail] = useState(user?.email);
    const [newFirstName, setNewFirstName] = useState(user?.displayName || "Prenom")
    const [newSecondName, setNewSecondName] = useState(user?.displayName || "Nom")
    const [currentPassword, setCurrentPassword] = useState("")
    const [loadingGererAbonemant, setLoadingGererAbonemant] = useState(false)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
        setOpenDialog(true);
    };

    const onCropComplete = (_croppedArea: Area, croppedPixels: { x: number; y: number; width: number; height: number }) => {
        setCroppedAreaPixels(croppedPixels);
    };

    const uploadImage = async () => {
        if (!selectedFile || !croppedAreaPixels) return;

        setIsUploading(true);
        const canvas = document.createElement("canvas");
        const image = new Image();
        image.src = URL.createObjectURL(selectedFile);
        await new Promise((resolve) => (image.onload = resolve));

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(
                image,
                croppedAreaPixels.x,
                croppedAreaPixels.y,
                croppedAreaPixels.width,
                croppedAreaPixels.height,
                0,
                0,
                croppedAreaPixels.width,
                croppedAreaPixels.height
            );
        }

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg")
        );

        if (!blob) {
            alert("Falha ao criar a imagem cortada.");
            return;
        }

        const storage = getStorage();
        const storageRef = ref(storage, `user/${user?.uid}/profile.jpg`);

        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        const firestore = getFirestore();
        if (!user?.uid) {
            alert("User ID is not available.");
            return;
        }
        const userRef = doc(firestore, "users", user.uid);
        await updateDoc(userRef, { photoURL: downloadURL });

        await updatePhotoURLInContext(downloadURL);
        setIsUploading(false);
        setOpenDialog(false);
        toaster.create({
            title: "Photo de profil mise à jour",
            type: "success",
            description: "Votre photo de profil a été mise à jour avec succès.",
        })
    };

    const handleUserChange = async () => {
        setIsUploading(true);
        await updateUserName(newFirstName, newSecondName);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (newEmail && user && newEmail !== user.email && emailRegex.test(newEmail)) {
            if (user?.email) {
                await handleEmailChange(currentPassword, user.email);
            }
        }
        setIsUploading(false);
        toaster.create({
            title: "Profil mise à jour",
            type: "success",
            description: "Votre profil a été mise à jour avec succès.",
        })
    }

    const handlePortalSession = async () => {
        try {
            setLoadingGererAbonemant(true);
            const createPortalSession = httpsCallable(functions, 'createPortalSession');
            const result = await createPortalSession({});
            const data = result.data as { url?: string };
            if (data.url) {
                setLoadingGererAbonemant(false);
                window.open(data.url, '_blank');
            } else {
                toaster.create({
                    title: "Erreur",
                    type: "error",
                    description: "Aucun lien de session de portail reçu.",
                });
            }
        } catch (error) {
            console.error("Error creating portal session:", error);
            toaster.create({
                title: "Erreur",
                type: "error",
                description: "Impossible de créer la session de portail.",
            });
        }
    };

    return (
        <Box p={6}>
            <Toaster />
            <Heading as="h2" size="lg" mb={6}>
                Ton profil
            </Heading>
            <Flex gap={10}>
                <VStack gap={4} >
                    <Box w="200px" h="200px">
                        <Avatar.Root>
                            <Avatar.Fallback name={user?.displayName || "Profile Photo"} />
                            <Avatar.Image src={user?.photoURL || "/avatar.svg"} />
                        </Avatar.Root>
                    </Box>
                    <FileUpload.Root color="orange.500" onChange={handleFileChange}>
                        <FileUpload.Trigger>
                            <Button >
                                <HiUpload /> Changez votre photo de profil
                            </Button>
                        </FileUpload.Trigger>
                    </FileUpload.Root>
                    <Dialog.Root lazyMount open={openDialog} size="xl">
                        <Dialog.Content>
                            <Dialog.Header>Crop photo</Dialog.Header>
                            <Dialog.Body>
                                {selectedFile && (
                                    <Box position="relative" width="100%" height="400px">
                                        <Cropper
                                            image={URL.createObjectURL(selectedFile)}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={1}
                                            onCropChange={setCrop}
                                            onZoomChange={setZoom}
                                            onCropComplete={onCropComplete}
                                        />
                                    </Box>
                                )}
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="ghost" mr={3}>
                                        Annuler
                                    </Button>
                                </Dialog.ActionTrigger>
                                {isUploading ?
                                    <Text>Enregistrement...</Text>
                                    :
                                    <Button colorPalette="green" onClick={uploadImage}>
                                        Enregistrer
                                    </Button>}
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Root>
                </VStack>

                <VStack>
                    <Fieldset.Root>
                        <Fieldset.Content>
                            <HStack>
                                <Field.Root>
                                    <Field.Label>Prénom</Field.Label>
                                    <Input onChange={e => setNewFirstName(e.target.value)} value={newFirstName} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Nom</Field.Label>
                                    <Input onChange={e => setNewSecondName(e.target.value)} value={newSecondName} />
                                </Field.Root>
                            </HStack>
                            <PasswordInput onChange={e => setCurrentPassword(e.target.value)} value={currentPassword} />
                            <Field.Root>
                                <Field.Label>Adresse Email</Field.Label>
                                <Input onChange={(e) => setNewEmail(e.target.value)} value={newEmail || ''} />
                                <Field.ErrorText>Vous besoin de ecrire ton mot de passe actuel</Field.ErrorText>
                            </Field.Root>
                            <Field.Root>
                                <Field.Label>Nouveau mot de Passe</Field.Label>
                                <Input autoComplete="new-password" type="password" placeholder="Nouveau mot de passe" />
                            </Field.Root>
                        </Fieldset.Content>
                        <Dialog.Root placement="top">
                            <Dialog.Trigger>
                                <Button disabled={isUploading} onClick={() => handleUserChange()}>
                                    Enregistrer
                                </Button>
                            </Dialog.Trigger>
                            <Dialog.Content>
                                <Dialog.Header>Confirmation</Dialog.Header>
                                <Dialog.Body>
                                    <Text>
                                        Si&apos;l vous plait, confirmez votre email.
                                    </Text>
                                </Dialog.Body>
                                <Dialog.Footer>
                                </Dialog.Footer>
                                <Dialog.CloseTrigger />
                            </Dialog.Content>
                        </Dialog.Root>
                    </Fieldset.Root>
                </VStack>
            </Flex>
            <Box mt={8}>
                <Heading as="h3" size="md" mb={4}>
                    Préférences Email
                </Heading>
                <VStack align="start" gap={2}>
                    <EmailNotificationToggle />
                </VStack>
            </Box>

            <Box mt={8}>
                <Heading as="h3" size="md" mb={4}>
                    Gestion de vos données personnelles
                </Heading>
                <Text>
                    Veuillez consulter notre   <Link href="/legal/politique-confidentialite">Politique de Confidentialité </Link>
                    pour tout savoir sur la manière dont nous traitons vos données personnelles
                </Text>
            </Box>

            <Box mt={8}>
                <Heading as="h3" size="md" mb={4}>
                    Mon abonnement
                </Heading>
                {pro ? (
                    <VStack align="start">
                        <Text>
                            Vous bénéficiez d&apos;un abonnement Recape&apos;ps pro.
                        </Text>
                        <Button
                            mt={4}
                            colorPalette="orange"
                            onClick={handlePortalSession}
                            loading={loadingGererAbonemant}
                        >
                            Gérer mon abonnement
                        </Button>
                    </VStack>
                ) : (
                    <Button asChild>
                        <Link href="/checkout">Passer à Recap&apos;eps pro</Link>
                    </Button>
                )}
            </Box>
        </Box>
    );
}

