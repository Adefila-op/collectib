import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    {
      name: "affiliate-static-routes",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url?.split("?")[0];
          if (url === "/affliate" || url === "/affliate/" || url === "/affiliate" || url === "/affiliate/") {
            req.url = req.url?.replace(url, "/affliate/index.html");
          }
          if (url === "/affliates" || url === "/affliates/") {
            req.url = req.url?.replace(url, "/affliates/index.html");
          }
          next();
        });
      },
    },
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  base: "./",
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
