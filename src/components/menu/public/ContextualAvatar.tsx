import {
    Avatar,
    Menu,
    defineStyle,
    Portal,
    HStack,
    Button
} from "@chakra-ui/react";
import Link from "next/link";
import {
    LuBadge, LuSparkles, LuLogOut,
} from "react-icons/lu";
import { signOut } from "@/lib/firebase/auth";
import { FiLogIn } from "react-icons/fi";

const ring = defineStyle({
    outline: "2px solid",
    outlineColor: "green.500",
    outlineOffset: "2px",
});

export default function ContextualAvatar({ user }: { user: any }) {
    if (!user) {
        return (
            <Button asChild>
                <Link href="/login">
                    <HStack gap={2}>
                        <FiLogIn />
                        Login
                    </HStack>
                </Link>
            </Button>
        )
    }
    return (
        <Menu.Root>
            <Menu.Trigger>
                <Avatar.Root css={ring}>
                    <Avatar.Fallback name={user?.displayName ?? "Étudiant"} />
                    <Avatar.Image src={user?.photoURL ?? "/avatar.svg"} />
                </Avatar.Root>
            </Menu.Trigger>

            <Portal>
                <Menu.Positioner>
                    <Menu.Content w="56">
                        <Menu.Item value="profil" asChild >
                            <Link href="/compte/profil">
                                <HStack gap={2}>
                                    <LuBadge />
                                    Profil
                                </HStack>
                            </Link>
                        </Menu.Item>
                        <Menu.Separator />
                        <Menu.Item value="abonnement" asChild >
                            <Link href="/abonnement">
                                <HStack gap={2}>
                                    <LuSparkles />
                                    Passer à Recap&apos;eps Pro
                                </HStack>
                            </Link>
                        </Menu.Item>
                        < Menu.Separator />
                        <Menu.Item value="logout" onClick={signOut}>
                            <HStack gap={2}>
                                <LuLogOut />
                                Déconnexion
                            </HStack>
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    );
}
