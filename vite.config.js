import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {VitePWA} from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
                name: 'Congelados - Gestión de Heladerías',
                short_name: 'Congelados',
                description: 'La plataforma todo-en-uno para administrar tu heladería o frutería.',
                theme_color: '#0d6efd',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/',
                start_url: '/login',
                shortcuts: [
                    {
                        name: 'Punto de Venta',
                        url: '/pos',
                        icons: [{ src: '/icons/pos.png', sizes: '192x192' }]
                    }
                ],
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
            },
        })
    ],
})
