declare module 'vite-plugin-minify' {
    import { Plugin } from 'vite';
    export function ViteMinifyPlugin(opts?: Record<string, unknown>): Plugin;
  }