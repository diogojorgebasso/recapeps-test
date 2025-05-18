/* eslint-disable @next/next/no-img-element */
'use client';
import { useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
    Box,
    Button,
    Dialog,
    VStack, // Import VStack for layout
} from '@chakra-ui/react';
import { HiUpload } from 'react-icons/hi';
import { FileUpload } from '@chakra-ui/react'; // Assuming this is a custom or library component
import { useProfilePhoto } from '../useProfilePhoto';
import { useUserWithClaims } from '@/lib/getUser'; // Import useUserWithClaims

export default function ProfilePhotoUploader() {
    const { user } = useUserWithClaims(); // Get user data
    const { savePhoto, loading: savingPhoto } = useProfilePhoto(); // Renamed loading to savingPhoto for clarity
    const [file, setFile] = useState<File | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [area, setArea] = useState<Area | null>(null);
    const [open, setOpen] = useState(false);

    const onChoose = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            setOpen(true);
        }
    };

    const onSave = async () => {
        if (!file || !area) return;
        const blob = await cropToBlob(file, area);
        await savePhoto(blob); // This should trigger a refresh of user.photoURL via onAuthStateChanged
        setOpen(false);
        setFile(null);
    };

    return (
        <VStack gap={4} align="center">

            <img
                width={100}
                height={100}
                src={user?.photoURL || "/avatar.svg"} alt="Profile Photo"
            />


            < FileUpload.Root onChange={onChoose} >
                <FileUpload.Trigger asChild>
                    <Button><HiUpload />Changer de photo</Button>
                </FileUpload.Trigger>
            </FileUpload.Root>

            <Dialog.Root open={open} size="xl">
                <Dialog.Content>
                    <Dialog.Header>Rogner la photo</Dialog.Header>
                    <Dialog.Body>
                        {file && (
                            <Box pos="relative" h="400px">
                                <Cropper
                                    image={URL.createObjectURL(file)}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={(_, pixels) => setArea(pixels)}
                                />
                            </Box>
                        )}
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        {savingPhoto ? (
                            <Button loading colorPalette="green" loadingText="Enregistrement…">
                                Enregistrer
                            </Button>
                        ) : (
                            <Button colorPalette="green" onClick={onSave}>
                                Enregistrer
                            </Button>
                        )}
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Root>
        </VStack >
    );
}

/* helper local */
async function cropToBlob(file: File, a: Area): Promise<Blob> {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((r) => (img.onload = r));
    const canvas = document.createElement('canvas');
    canvas.width = a.width;
    canvas.height = a.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, a.x, a.y, a.width, a.height, 0, 0, a.width, a.height);
    return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg'));
}
