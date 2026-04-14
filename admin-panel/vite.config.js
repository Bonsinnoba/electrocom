import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        target: 'es2019',
        cssCodeSplit: true,
        sourcemap: false,
        reportCompressedSize: true,
        chunkSizeWarningLimit: 900,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (id.includes('recharts')) return 'charts';
                    if (id.includes('react-router') || id.includes('@remix-run')) return 'router';
                    if (id.includes('lucide-react')) return 'icons';
                    return 'vendor';
                },
            },
        },
    },
})
