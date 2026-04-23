import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  build: {
    cssCodeSplit: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/index.ts"),
      name: "KitComponents",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "react/jsx-runtime",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css") {
            return "styles.css";
          }
          return assetInfo.name || "asset";
        },
      },
    },
  },
});
