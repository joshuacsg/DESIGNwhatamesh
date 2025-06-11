import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

import { ViteMinifyPlugin } from "vite-plugin-minify"

// @ts-ignore
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    mode === "inline" && viteSingleFile({
      removeViteModuleLoader: true,
    }),
    mode === "inline" && ViteMinifyPlugin({
      collapseWhitespace:        true,
      removeComments:            true,
      removeRedundantAttributes: true,
      removeEmptyAttributes:     true,
      minifyCSS:                 true,
      minifyJS:                  true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Only tweak build when creating the inline bundle
  ...(mode === "inline"
    ? {
        build: {
          target: "esnext",
          cssTarget: "chrome61",
          assetsDir: "", // put assets next to index.html (will be deleted by plugin)
          minify: "terser",
          terserOptions: {
            compress: {
              booleans_as_integers: true,
              drop_console: true,
              passes: 2,
            },
            mangle: {
              toplevel: true,
              // mangle properties that are obviously private (start with underscore)
              properties: {
                regex: /^_(?!jsx|jsxs)/,
              },
            },
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
        },
      }
    : {}),
}))