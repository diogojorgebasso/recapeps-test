import { NextRequest, NextResponse } from 'next/server';
import {
    authMiddleware,
    redirectToLogin,
} from 'next-firebase-auth-edge';

const PUBLIC_PATHS = ['/'];
const AUTH_PATHS = ['/forgot-password', '/login', '/register', '/verify-email'];

const firebaseApiKey = process.env.FIREBASE_API_KEY;

const cookieSignatureKeys = [
    process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT!,
    process.env.AUTH_COOKIE_SIGNATURE_KEY_PREVIOUS!,
].filter(Boolean);

const cookieSerializeOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 12 * 60 * 60 * 24,
};

export async function middleware(request: NextRequest) {
    if (!firebaseApiKey || cookieSignatureKeys.length === 0) {
        console.log('Cookie signature keys:', firebaseApiKey, cookieSignatureKeys);
        console.error('Missing Firebase configuration in environment variables.');
        return new Response('Internal Server Error: Missing configuration', { status: 500 });
    }

    const { pathname, searchParams } = request.nextUrl;

    return authMiddleware(request, {
        loginPath: '/api/login',
        logoutPath: '/api/logout',
        apiKey: firebaseApiKey,
        cookieName: 'AuthToken',
        cookieSignatureKeys,
        cookieSerializeOptions,
        enableMultipleCookies: true,
        debug: process.env.NODE_ENV !== 'production',
        checkRevoked: false,

        handleValidToken: async ({ decodedToken }, headers) => {
            const isPro = decodedToken.pro === true;

            // Handle redirection after login
            const redirectPath = searchParams.get('redirect');

            if (AUTH_PATHS.includes(pathname)) {
                const redirectUrl = redirectPath ? new URL(`/${redirectPath}`, request.url) : new URL('/dashboard', request.url);
                return NextResponse.redirect(redirectUrl);
            }

            if (!decodedToken.email_verified && !pathname.startsWith('/verify-email')) {
                const verifyUrl = new URL('/verify-email', request.url);
                return NextResponse.redirect(verifyUrl);
            }

            headers.set('X-User-ID', decodedToken.uid || '');
            headers.set('X-User-Email', decodedToken.email || '');
            headers.set('X-User-Email-Verified', String(decodedToken.email_verified || false));
            headers.set('X-User-Pro', String(isPro));

            return NextResponse.next({
                request: { headers },
            });
        },

        handleInvalidToken: async (reason) => {
            console.info('Authentication failed:', reason);

            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname.slice(1));

            return NextResponse.redirect(loginUrl);
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
        '/parcours/:path*',
        '/compte/:path*',
    ],
};