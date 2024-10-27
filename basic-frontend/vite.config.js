import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { gitCommitHashPlugin } from "vite-plugin-git-commit-hash";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), gitCommitHashPlugin()],
})
