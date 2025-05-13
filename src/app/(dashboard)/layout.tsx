import type { ReactNode } from "react";
import { Suspense } from "react";

import {
    Flex,
    Box,
    Spinner,
} from "@chakra-ui/react";

import DesktopMenu from "@/components/menu/dashboard/DesktopMenu";   // ← client (tour + sidebar)
import MobileMenu from "@/components/menu/dashboard/MobileMenu"; // optional

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <Flex minH="100vh">
            <Suspense fallback={<Spinner position="fixed" top={4} left={4} />}>
                <DesktopMenu />
                <MobileMenu />
            </Suspense>

            <Box
                flex="1">
                {children}
            </Box>
        </Flex >
    );
}
