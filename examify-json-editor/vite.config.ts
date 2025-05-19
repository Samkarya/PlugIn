// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Replace 'your-repo-name' with your GitHub repository name
const repoName = 'examify-json-editor'; // Or fetch from package.json if you prefer

export default defineConfig(({ command }) => {
  const base = command === 'build' ? `/${repoName}/` : '/';
  return {
    plugins: [react()],
    base: base, // Set the base path for the build
    build: {
      outDir: 'dist', // This is usually the default
    },
  };
});