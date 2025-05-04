import { NextRequest, NextResponse } from 'next/server';

import {
    authMiddleware,
    redirectToHome,
    redirectToLogin,
} from 'next-firebase-auth-edge';

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/', '/signin', '/register', '/reset-password'];

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

const cookieSignatureKeys = [
    process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT!,
    process.env.AUTH_COOKIE_SIGNATURE_KEY_PREVIOUS!, // Add previous key for rotation
].filter(Boolean);

const cookieSerializeOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax' as const,
    maxAge: 12 * 60 * 60 * 24, // twelve days
};


export async function middleware(request: NextRequest) {
    if (!firebaseApiKey || cookieSignatureKeys.length === 0 || !serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.error("Missing Firebase configuration in environment variables.");
        // Return a generic error response or redirect
        return new Response("Internal Server Error: Missing configuration", { status: 500 });
    }

    return authMiddleware(request, {
        loginPath: '/api/login',
        logoutPath: '/api/logout',
        apiKey: firebaseApiKey,
        cookieName: "AuthToken",
        cookieSignatureKeys: cookieSignatureKeys,
        cookieSerializeOptions: cookieSerializeOptions,
        enableMultipleCookies: true,
        debug: process.env.NODE_ENV !== 'production',
        checkRevoked: false, // Set to true if needed, consider performance impact

        handleValidToken: async ({ token, decodedToken }, headers) => {
            // Example: Redirect authenticated users from public paths like /signin
            if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
                return redirectToHome(request); // Redirect to '/' or a dashboard page
            }

            if (!decodedToken.email_verified &&
                !request.nextUrl.pathname.startsWith('/verify-email')) {
                const verifyUrl = new URL('/verify-email', request.url);
                return NextResponse.redirect(verifyUrl);
            }

            headers.set('X-User-ID', decodedToken.uid || ''); // Handle cases where uid might be null
            headers.set('X-User-Email', decodedToken.email || ''); // Handle cases where email might be null
            headers.set('X-User-Email-Verified', String(decodedToken.email_verified || false));

            return NextResponse.next({
                request: {
                    headers, // Pass modified headers along
                },
            });
        },
        handleInvalidToken: async (reason) => {
            console.info('Authentication failed:', reason);
            return redirectToLogin(request, {
                path: '/login',
                publicPaths: PUBLIC_PATHS,
            });
        },
        handleError: async (error) => {
            console.error('Authentication middleware error:', error);
            return redirectToLogin(request, {
                path: '/login',
                publicPaths: PUBLIC_PATHS,
            });
        },
    });
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|signin|register|reset-password|verify-email).*)',
        '/parcours/:path*',         // modules d’entraînement
        '/compte/:path*',           // profil, notifications, facturation
    ],
};
