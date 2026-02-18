import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/rss-aggregator/',
  title: "Tilly's Journal",
  description: 'AI-powered RSS news aggregator',
  head: [
    ['link', { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📓</text></svg>' }],
  ],
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo.svg' },
  },
  vite: {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_CHAT_URL': JSON.stringify(process.env.VITE_CHAT_URL || 'http://localhost:3001'),
    },
  },
})
