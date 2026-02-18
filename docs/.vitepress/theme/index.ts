import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import NewsPage from '../components/NewsPage.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('NewsPage', NewsPage)
  },
} satisfies Theme
