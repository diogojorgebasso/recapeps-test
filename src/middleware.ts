// middleware.ts  (Edge by default, no Node libs!)
import { NextRequest, NextResponse } from 'next/server';
import {
    authMiddleware,
    redirectToHome,
    redirectToLogin,
} from 'next-firebase-auth-edge';
import { cookies } from 'next/headers'; // Import cookies if needed elsewhere, or remove if unused

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/signin', '/register', '/reset-password']; // Adjust as needed

// Get configuration from environment variables
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
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    // Replace newline characters for environment variable compatibility
    privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined!,
};

export async function middleware(request: NextRequest) {
    // Check if required environment variables are set
    if (!firebaseApiKey || cookieSignatureKeys.length === 0 || !serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.error("Missing Firebase configuration in environment variables.");
        // Return a generic error response or redirect
        return new Response("Internal Server Error: Missing configuration", { status: 500 });
    }

    return authMiddleware(request, {
        loginPath: '/api/login', // Your API route for handling login
        logoutPath: '/api/logout', // Your API route for handling logout
        apiKey: firebaseApiKey,
        cookieName: "AuthToken",
        cookieSignatureKeys: cookieSignatureKeys,
        cookieSerializeOptions: cookieSerializeOptions,
        serviceAccount: serviceAccount,

        // Optional: Enable multi-cookie support if tokens get large
        enableMultipleCookies: true,
        // Optional: Enable custom token support if needed (default: false)
        enableCustomToken: false,
        // Optional: Enable debug logging (set to false in production)
        debug: process.env.NODE_ENV !== 'production',
        // Optional: Set tenant ID if using Firebase multi-tenancy
        // tenantId: process.env.FIREBASE_TENANT_ID,
        // Optional: Enable revoked token check (requires network request)
        checkRevoked: false, // Set to true if needed, consider performance impact

        handleValidToken: async ({ token, decodedToken }, headers) => {
            // Example: Redirect authenticated users from public paths like /signin
            if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
                return redirectToHome(request); // Redirect to '/' or a dashboard page
            }

            // Add custom logic here if needed after successful authentication
            // e.g., check for email verification before allowing access to certain routes

            /* Example: Check for e-mail verification (similar to your original logic) */
            if (!decodedToken.email_verified &&
                !request.nextUrl.pathname.startsWith('/verify-email')) {
                // Redirect to email verification page
                const verifyUrl = new URL('/verify-email', request.url);
                return NextResponse.redirect(verifyUrl);
            }

            // Inject authentication headers for server components or API routes
            headers.set('X-User-ID', decodedToken.uid);
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
            // Redirect to login page if token is invalid or missing
            return redirectToLogin(request, {
                path: '/signin', // Your sign-in page path
                publicPaths: PUBLIC_PATHS,
            });
        },
        handleError: async (error) => {
            console.error('Authentication middleware error:', error);
            // Redirect to login page on unexpected errors
            return redirectToLogin(request, {
                path: '/signin', // Your sign-in page path
                publicPaths: PUBLIC_PATHS,
            });
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - /signin (public sign-in page)
         * - /register (public registration page)
         * - /reset-password (public reset password page)
         * - /verify-email (public email verification page)
         *
         * Also include the root path '/'.
         * Include API routes for login/logout if handled by `authMiddleware`.
         */
        '/', // Protect the root path
        '/((?!_next/static|_next/image|favicon.ico|signin|register|reset-password|verify-email).*)',
        '/parcours/:path*',         // modules d’entraînement
        '/compte/:path*',           // profil, notifications, facturation
    ],
};
