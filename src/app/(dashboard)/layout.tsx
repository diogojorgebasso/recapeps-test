import type { ReactNode } from "react";
import { Suspense } from "react";

import {
    Flex,
    Box,
    Spinner,
} from "@chakra-ui/react";

import DesktopMenu from "@/components/menu/dashboard/DesktopMenu";   // ← client (tour + sidebar)
import MobileMenu from "@/components/menu/dashboard/MobileMenu"; // optional

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <Flex minH="100vh">
            {/* ①  chrome that needs the browser (auth, tour, media queries) */}
            <Suspense fallback={<Spinner position="fixed" top={4} left={4} />}>
                <DesktopMenu />       {/* shows itself ≥ 768 px (inside the component) */}
                <MobileMenu />   {/* shows itself < 768 px */}
            </Suspense>

            {/* ②  main scrollable panel */}
            <Box
                flex="1"
                overflowY="auto"
                px={{ base: 4, md: 8 }}
                py={6}
                /* keep space for the fixed sidebar on desktop
                   (widths match the values inside DesktopMenu) */
                ml={{ md: "24", lg: "60" }}
            >
                {children /* dashboard pages stream here */}
            </Box>
        </Flex>
    );
}
