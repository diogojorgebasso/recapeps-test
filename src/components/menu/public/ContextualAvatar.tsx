"use client";

import {
    Avatar,
    Menu,
    defineStyle,
    Button,
    Portal,
} from "@chakra-ui/react";
import Link from "next/link";
import {
    LuBadge, LuSparkles, LuLogOut, LuLogIn,
} from "react-icons/lu";
import { signOut } from "@/lib/firebase/auth";
import { useAuth } from "@/contexts/Auth/useAuth";

const ring = defineStyle({
    outline: "2px solid",
    outlineColor: "green.500",
    outlineOffset: "2px",
});

export default function ContextualAvatar() {
    const { user, pro } = useAuth();

    if (!user) {
        return (
            <Button asChild size="sm">
                <Link href="/login">Se connecter</Link>
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
                            <Link href="/profil"><LuBadge />Profil</Link>
                        </Menu.Item>
                        <Menu.Separator />
                        {!pro && (
                            <Menu.Item value="checkout" asChild >
                                <Link href="/checkout"><LuSparkles />Passer Pro</Link>
                            </Menu.Item>)}
                        < Menu.Separator />
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
