import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Recap'eps",
        short_name: "Recap'eps",
        description: "Recap'eps est un outil de révision imparable pour réussir les concours du CAPEPS.",
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#fff',
        theme_color: '#ea580c',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/ico',
                purpose: 'any',
            },
        ],
    }
}