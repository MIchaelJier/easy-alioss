import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import ViteAliOSSPlugin from '@easy-alioss/vite-plugin';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [vue(), ViteAliOSSPlugin()],
});
