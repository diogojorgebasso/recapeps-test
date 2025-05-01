"use client";

import {
    Avatar,
    Menu,
    defineStyle,
    Button,
    Portal,
} from "@chakra-ui/react";
import NextLink from "next/link";
import {
    LuBadge, LuBell, LuSparkles, LuLogOut, LuLogIn,
} from "react-icons/lu";
import { signOut } from "@/lib/firebase/auth";
import { useAuth } from "@/components/AuthProvider";

const ring = defineStyle({
    outline: "2px solid",
    outlineColor: "green.500",
    outlineOffset: "2px",
});

export default function ContextualAvatar() {
    const { user } = useAuth();

    if (!user) {
        return (
            <Button asChild size="sm">
                <NextLink href="/login">Se connecter</NextLink>
            </Button>
        );
    }

    return (
        <Menu.Root>
            <Menu.Trigger>
                <Avatar.Root css={ring}>
                    <Avatar.Fallback name={user.displayName ?? "Étudiant"} />
                    <Avatar.Image src={user.photoURL ?? "/avatar.svg"} />
                </Avatar.Root>
            </Menu.Trigger>

            <Portal>
                <Menu.Positioner>
                    <Menu.Content w="56">
                        <Menu.Item value="profil" asChild >
                            <LuBadge />
                            <NextLink href="/profil">Profil</NextLink>
                        </Menu.Item>
                        <Menu.Separator />
                        <Menu.Item value="checkout" asChild >
                            <LuSparkles />
                            <NextLink href="/checkout">Passer Pro</NextLink>
                        </Menu.Item>
                        <Menu.Separator />
                        <Menu.Item value="logout" onClick={signOut}>
                            <LuLogOut />
                            Déconnexion
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    );
}
