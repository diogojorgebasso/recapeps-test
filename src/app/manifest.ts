import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Recapeps - Réussir ce n'est qu'une question d'entraînement",
        short_name: 'Recapeps',
        description: "Recap'eps est un outil de révision imparable pour réussir les concours du CAPEPS.",
        start_url: '/',
        scope: '/', // TODO : See if the scope is correct
        display: 'standalone',
        background_color: '#fff',
        theme_color: '#ea580c',
        icons: [
            {
                src: '/icon.ico',
                sizes: 'any',
                type: 'image/ico',
                purpose: 'any',
            },
        ],
    }
}