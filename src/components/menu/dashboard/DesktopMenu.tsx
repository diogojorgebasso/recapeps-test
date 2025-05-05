"use client";

import {
    VStack,
    IconButton,
    Avatar,
    Menu,
    Button,
    Portal,
    useDisclosure,
    useMediaQuery,
    Dialog,
    createOverlay,
    Text,
} from "@chakra-ui/react";
import Link from "next/link";
import {
    LuBadge,
    LuLogOut,
    LuLogIn,
    LuLayoutDashboard,
    LuFileText,
    LuMicVocal,
    LuCircleUser,
    LuCircle,
} from "react-icons/lu";
import { useState } from "react";
import { signOut } from "@/lib/firebase/auth";
import { useAuth } from "@/auth/AuthContext";
import { SimpleColorModeButton } from "@/components/ui/color-mode";

const ITEMS = [
    { href: "/dashboard", label: "Tableau de bord", icon: LuLayoutDashboard },
    { href: "/ecrit-1", label: "Écrit 1", icon: LuFileText },
    { href: "/ecrit-2", label: "Écrit 2", icon: LuFileText },
    { href: "/oral-1", label: "Oral 1", icon: LuMicVocal },
    { href: "/oral-3", label: "Oral 3", icon: LuMicVocal },
    { href: "/profil", label: "Profil", icon: LuCircleUser },
    { href: "/contact", label: "Contact", icon: LuCircle },
] as const;

type Step = (typeof ITEMS)[number];

/* ─── 2 · OVERLAY – one definition, reused via .update() ─────────── */

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
                        Découvre la section « {p.stepData.label} ».
                    </Text>
                </Dialog.Body>
                <Dialog.Footer gap="2">
                    <Button size="sm" variant="ghost" onClick={p.onPrev} disabled={p.step === 0}>
                        Préc.
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

/* ─── 3 · MAIN COMPONENT ─────────────────────────────────────────── */

export default function DesktopMenu() {
    const { user } = useAuth();
    const [isDesktop] = useMediaQuery(["(min-width:768px)"], { ssr: false });

    /* intro dialog: offer the tour once */
    const intro = useDisclosure({ // && profile?.hasSeenTour
        defaultOpen: isDesktop
    });

    /* current tour step (null = not running) */
    const [step, setStep] = useState<number | null>(null);

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
                else TourOverlay.close("tour"); // finished
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
                                Souhaites-tu un petit tour des fonctionnalités&nbsp;?
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
                                    Oui !
                                </Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* sidebar */}
            <VStack
                as="nav"
                position="fixed"
                bg="orange.400"
                borderRadius="0 0 16px 0"
                p="2"
                gap="6"
                shadow="lg"
            >
                {/* avatar menu */}
                <Menu.Root>
                    <Menu.Trigger>
                        <Avatar.Root>
                            <Avatar.Fallback name={user?.displayName ?? "Étudiant"} />
                            <Avatar.Image src={user?.photoURL ?? "/avatar.svg"} />
                        </Avatar.Root>
                    </Menu.Trigger>
                    <Portal>
                        <Menu.Positioner>
                            <Menu.Content minW="56" rounded="lg">
                                <Menu.Item value="checkout" asChild >
                                    <Link href="/checkout">Passer à Pro</Link>
                                </Menu.Item>
                                <Menu.Separator />
                                <Menu.Item value="profil" asChild>
                                    <LuBadge />
                                    <Link href="/profil">Profil</Link>
                                </Menu.Item>
                                <Menu.Separator />
                                {user ? (
                                    <Menu.Item value="logout" onClick={signOut}>
                                        <LuLogOut />
                                        Déconnexion
                                    </Menu.Item>
                                ) : (
                                    <Menu.Item value="login" asChild>
                                        <LuLogIn />
                                        <Link href="/login">Se connecter</Link>
                                    </Menu.Item>
                                )}
                            </Menu.Content>
                        </Menu.Positioner>
                    </Portal>
                </Menu.Root>

                {/* nav buttons (anchor refs created inline) */}
                {ITEMS.map((item, idx) => (
                    <Link key={item.href} href={item.href}>
                        <IconButton
                            aria-label={item.label}
                            variant="ghost"
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
                ))}

                <SimpleColorModeButton my="5" />
            </VStack>

            {/* render overlays */}
            <TourViewport />
        </>
    );
}
