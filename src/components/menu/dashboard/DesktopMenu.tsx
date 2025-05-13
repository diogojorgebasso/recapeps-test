"use client";

import {
    VStack,
    IconButton,
    Button,
    Portal,
    useDisclosure,
    Dialog,
    createOverlay,
    Text,
} from "@chakra-ui/react";
import Link from "next/link";
import {
    LuLayoutDashboard,
    LuFileText,
    LuMicVocal,
    LuCircle,
} from "react-icons/lu";
import { useState, useEffect } from "react";
import { SimpleColorModeButton } from "@/components/ui/color-mode";
import { usePathname } from "next/navigation";
import { FaRegUserCircle } from "react-icons/fa";
import AvatarMenu from "./AvatarMenu";

const ITEMS = [
    { href: "/parcours/dashboard", label: "Tableau de bord", icon: LuLayoutDashboard },
    { href: "/parcours/ecrit-1", label: "Écrit 1", icon: LuFileText },
    { href: "/parcours/ecrit-2", label: "Écrit 2", icon: LuFileText },
    { href: "/parcours/oral-1", label: "Oral 1", icon: LuMicVocal },
    { href: "/parcours/oral-3", label: "Oral 3", icon: LuMicVocal },
    { href: "/compte/profil", label: "Profil", icon: FaRegUserCircle },
    { href: "/contact", label: "Contact", icon: LuCircle },
] as const;

type Step = (typeof ITEMS)[number];

const TourOverlay = createOverlay<{
    anchor: HTMLElement;
    step: number;
    stepData: Step;
    total: number;
    onPrev(): void;
    onNext(): void;
}>((p) => (
    <Dialog.Root open={p.open} onOpenChange={p.onOpenChange}>
        <Dialog.Positioner>
            <Dialog.Content maxW="sm">
                <Dialog.Header>
                    <Dialog.Title>{`${p.step + 1} / ${p.total}`}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body spaceY="3">
                    <Text fontWeight="semibold">{p.stepData.label}</Text>
                    <Text fontSize="sm">
                        {/* simple auto-description; replace with custom copy if needed */}
                        Découvre la section «{p.stepData.label}».
                    </Text>
                </Dialog.Body>
                <Dialog.Footer gap="2">
                    <Button size="sm" variant="ghost" onClick={p.onPrev} disabled={p.step === 0}>
                        Retour
                    </Button>
                    <Button size="sm" onClick={p.onNext}>
                        {p.step + 1 === p.total ? "Fin" : "Suiv."}
                    </Button>
                </Dialog.Footer>
            </Dialog.Content>
        </Dialog.Positioner>
    </Dialog.Root>
));

export const TourViewport = TourOverlay.Viewport;

const INTRO_TOUR_STORAGE_KEY = 'hasCompletedRecapepsIntroTour'; // Key for localStorage

export default function DesktopMenu() {
    const pathname = usePathname();

    /* intro dialog: offer the tour once */
    const intro = useDisclosure({});

    useEffect(() => {
        // Check localStorage only on the client-side
        if (typeof window !== 'undefined') {
            const hasCompletedTour = localStorage.getItem(INTRO_TOUR_STORAGE_KEY);
            if (!hasCompletedTour) {
                intro.onOpen();
            }
        }
    }, [intro]);

    /* current tour step (null = not running) */
    const [step, setStep] = useState<number | null>(null);

    const markTourAsCompleted = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(INTRO_TOUR_STORAGE_KEY, 'true');
        }
        intro.onClose();
    };

    /* helper to show/update overlay */
    const openStep = (idx: number, anchor: HTMLElement) => {
        const stepData = ITEMS[idx];
        const props = {
            anchor,
            step: idx,
            stepData,
            total: ITEMS.length,
            onPrev: () => openStep(Math.max(idx - 1, 0), anchor),
            onNext: () => {
                const next = idx + 1;
                if (next < ITEMS.length) openStep(next, anchor);
                else {
                    TourOverlay.close("tour");
                    markTourAsCompleted(); // mark tour as completed
                } // finished
            },
        };

        if (TourOverlay.get("tour")) TourOverlay.update("tour", props);
        else TourOverlay.open("tour", props).then(() => setStep(null));

        setStep(idx);
    };

    return (
        <>
            {/* offer the tour */}
            <Dialog.Root open={intro.open} onOpenChange={intro.onClose}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>Bienvenue !</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                Souhaites-tu faire un petit tour des fonctionnalités&nbsp;?
                            </Dialog.Body>
                            <Dialog.Footer gap="3">
                                <Button size="sm" variant="ghost" onClick={intro.onClose}>
                                    Non merci
                                </Button>
                                <Button
                                    size="sm"
                                    colorPalette="green"
                                    onClick={() => {
                                        intro.onClose();
                                        /* find first button DOM node */
                                        const firstBtn = document.querySelector<HTMLButtonElement>(
                                            '[data-tour="0"]',
                                        );
                                        if (firstBtn) openStep(0, firstBtn);
                                    }}
                                >
                                    Oui!
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            <VStack
                as="nav"
                position="fixed"
                bg="orange.400"
                borderRadius="0 0 16px 0"
                p="2"
                gap="6"
                shadow="lg"
                display={{ base: "none", md: "flex" }}
            >
                <AvatarMenu />

                {/* nav buttons (anchor refs created inline) */}
                {ITEMS.map((item, idx) => {
                    const isActive = pathname === item.href || (item.href !== "/parcours/dashboard" && pathname.startsWith(item.href))
                    return (
                        <Link key={item.href} href={item.href} passHref>
                            <IconButton
                                aria-label={item.label}
                                variant={isActive ? "solid" : "ghost"}
                                bg={isActive ? "orange.600" : undefined}
                                size="2xl"
                                color="white"
                                _hover={{ bg: "orange.500" }}
                                data-tour={idx}
                                ref={(el) => {
                                    if (el && step === idx) openStep(idx, el);
                                }}
                            >
                                <item.icon />
                            </IconButton>
                        </Link>
                    );
                })}

                <SimpleColorModeButton my="5" />
            </VStack>

            <TourViewport />
        </>
    );
}
