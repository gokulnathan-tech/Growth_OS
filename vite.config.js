import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      filename: 'manifest.json', // Manifest filename explicitly set
      includeAssets: ["favicon.ico", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "KaniTreePlanner",
        short_name: "KaniTree",
        description: "KaniTreePlanner - Binary Tree Planner",
        theme_color: "#0F172A",
        background_color: "#0F172A",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});