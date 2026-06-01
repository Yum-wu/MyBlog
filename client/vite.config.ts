import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { postsIndex } from "./vite-plugin-posts-index";

const isGitHubPages = !!process.env.GITHUB_ACTIONS;
const base = isGitHubPages ? "/MyBlog/" : "/";

export default defineConfig({
  base,
  plugins: [react(), postsIndex()],
  define: {
    __BASE_PATH__: JSON.stringify(isGitHubPages ? "/MyBlog" : ""),
  },
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules/react-dom/") || id.includes("node_modules/react/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/react-router-dom/") || id.includes("node_modules/react-router/")) {
            return "vendor-router";
          }
          if (id.includes("node_modules/react-markdown/") || id.includes("node_modules/remark-gfm/")) {
            return "vendor-markdown";
          }
          if (id.includes("node_modules/react-syntax-highlighter/") || id.includes("node_modules/highlight.js/")) {
            return "vendor-highlight";
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
