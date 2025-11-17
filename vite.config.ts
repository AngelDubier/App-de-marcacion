import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // FIX: Replaced process.cwd() with '.' to resolve TypeScript error 'Property 'cwd' does not exist on type 'Process''. '.' resolves to the project root.
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    // FIX: Cleaned up define to only include process.env.API_KEY as it's the only one needed per guidelines.
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    },
  };
});
