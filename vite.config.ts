
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['capacitor-bluetooth-printer'], // Exclude problematic package from optimization
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true, // Handle mixed module formats
    },
    rollupOptions: {
      // External packages that shouldn't be bundled
      external: ['capacitor-bluetooth-printer'],
    }
  }
}));
