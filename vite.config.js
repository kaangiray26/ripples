import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const fs = require('fs')
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
    base: '/ripples/',
    root: path.resolve(__dirname, 'src'),
    server: {
        hot: true,
        host: 'localhost',
        port: '8080'
        // host: 'ripples.localhost.direct',
        // port: 4443,
        // https: {
        //     key: fs.readFileSync('./localhost.direct/localhost.direct.key'),
        //     cert: fs.readFileSync('./localhost.direct/localhost.direct.crt'),
        // },

    },
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        }
    }
})