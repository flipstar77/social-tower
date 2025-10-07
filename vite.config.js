import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig({
    root: 'public',
    publicDir: 'assets',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        minify: 'terser',
        sourcemap: false,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'public/index.html'),
            },
            external: [
                // External CDN libraries - don't bundle these
                'echarts',
                'chart.js',
                'chartjs-adapter-date-fns',
            ],
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:6079',
                changeOrigin: true,
            },
        },
    },
    plugins: [
        legacy({
            targets: ['defaults', 'not IE 11'],
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './public'),
            '@js': resolve(__dirname, './public/js'),
            '@css': resolve(__dirname, './public/css'),
            '@config': resolve(__dirname, './public/config'),
        },
    },
    optimizeDeps: {
        exclude: ['echarts', 'chart.js', 'chartjs-adapter-date-fns'],
    },
});
