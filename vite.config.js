import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@js': path.resolve(__dirname, './src/js')
    }
  },
//   assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr'],
//   css: {
//     preprocessorOptions: {
//       scss: {
//         additionalData: `@import "@styles/scss/utils/_variables.scss";`
//       }
//     }
//   }
})