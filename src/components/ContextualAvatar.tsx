import NextLink from "next/link";
import { defineStyle, MenuItemGroup, Avatar, Menu, Button } from "@chakra-ui/react";
import { FaUser, FaCreditCard, FaKeyboard, FaSignOutAlt, FaCog } from "react-icons/fa";

const ringCss = defineStyle({
    outlineWidth: "2px",
    outlineColor: "green.500",
    outlineOffset: "2px",
    outlineStyle: "solid",
});

export default function ContextualAvatar() {
    const { currentUser, isAuthenticated, signOut } = useAuth();

    if (isAuthenticated) {
        return (
            <Menu.Root>
                <Menu.Trigger>
                    <Avatar.Root css={ringCss}>
                        <Avatar.Fallback name={currentUser?.displayName || "Étudiant"} />
                        <Avatar.Image src={currentUser?.photoURL || "/avatar.svg"} />
                    </Avatar.Root>
                </Menu.Trigger>
                <Menu.Content className="w-56">
                    <MenuItemGroup title="Mon Compte">
                        <Menu.Item value="profil" asChild>
                            <NextLink href="/profil" passHref>
                                <a>
                                    <FaUser />
                                    Profil
                                    <Menu.ItemCommand>⇧⌘P</Menu.ItemCommand>
                                </a>
                            </NextLink>
                        </Menu.Item>
                        <Menu.Item value="settings" asChild>
                            <NextLink href="/profil" passHref>
                                <a>
                                    <FaCog />
                                    Settings
                                    <Menu.ItemCommand>⌘S</Menu.ItemCommand>
                                </a>
                            </NextLink>
                        </Menu.Item>
                    </MenuItemGroup>
                    <Menu.Separator />
                    <Menu.Item value="checkout" asChild>
                        <NextLink href="/checkout" passHref>
                            <a>
                                <FaCreditCard />
                                Passez à Recap'eps Pro
                                <Menu.ItemCommand>⌘B</Menu.ItemCommand>
                            </a>
                        </NextLink>
                    </Menu.Item>
                    <Menu.Item value="keyboard">
                        <FaKeyboard />
                        Keyboard shortcuts
                        <Menu.ItemCommand>⌘K</Menu.ItemCommand>
                    </Menu.Item>
                    <Menu.Separator />
                    <Menu.Separator />
                    <Menu.Item onClick={signOut} value="logOut">
                        <FaSignOutAlt />
                        Log out
                        <Menu.ItemCommand>⇧⌘Q</Menu.ItemCommand>
                    </Menu.Item>
                </Menu.Content>
            </Menu.Root>
        );
    } else {
        return (
            <Button asChild>
                <NextLink href="/login" passHref>
                    <a>Login</a>
                </NextLink>
            </Button>
        );
    }
}
