<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { getArticles, getStats, getSourceCounts, type FetchOptions } from '../lib/articles'
import type { Article } from '../lib/supabase'
import ArticleCard from './ArticleCard.vue'
import ArticleSidebar from './ArticleSidebar.vue'
import ChatPanel from './ChatPanel.vue'

const articles = ref<Article[]>([])
const total = ref(0)
const loading = ref(true)
const stats = ref({ totalArticles: 0, todayArticles: 0, favoriteCount: 0, readLaterCount: 0, byCategory: {} as Record<string, number> })
const sources = ref<Record<string, number>>({})

// Filters
const category = ref('')
const source = ref('')
const search = ref('')
const timeFilter = ref('')
const view = ref('')
const page = ref(1)
const perPage = ref(20)

// Chat
const chatOpen = ref(false)
const chatArticleId = ref('')
const chatArticleTitle = ref('')

function openChat(id: string, title: string) {
  chatArticleId.value = id
  chatArticleTitle.value = title
  chatOpen.value = true
}

function getTimeRange(time: string): { startDate?: Date; endDate?: Date } {
  if (!time) return {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (time) {
    case 'today':
      return { startDate: today }
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { startDate: yesterday, endDate: today }
    }
    case 'week': {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return { startDate: weekAgo }
    }
    case 'month': {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return { startDate: monthAgo }
    }
    default:
      return {}
  }
}

const totalPages = computed(() => Math.ceil(total.value / perPage.value))

async function fetchArticles() {
  loading.value = true
  const { startDate, endDate } = getTimeRange(timeFilter.value)
  const offset = (page.value - 1) * perPage.value

  const options: FetchOptions = {
    category: category.value || undefined,
    source: source.value || undefined,
    search: search.value || undefined,
    startDate,
    endDate,
    favorites: view.value === 'favorites',
    readLater: view.value === 'read-later',
    limit: perPage.value,
    offset,
  }

  const result = await getArticles(options)
  articles.value = result.articles
  total.value = result.total
  loading.value = false
}

async function loadSidebarData() {
  const [s, sc] = await Promise.all([getStats(), getSourceCounts()])
  stats.value = s
  sources.value = sc
}

function setFilter(key: string, value: string) {
  if (key === 'category') { category.value = value; source.value = '' }
  if (key === 'source') { source.value = value; category.value = '' }
  if (key === 'time') timeFilter.value = value
  if (key === 'view') { view.value = value; category.value = ''; source.value = ''; timeFilter.value = '' }
  page.value = 1
}

function clearFilters() {
  category.value = ''
  source.value = ''
  search.value = ''
  timeFilter.value = ''
  view.value = ''
  page.value = 1
}

function onSearch() {
  page.value = 1
  fetchArticles()
}

function setPerPage(n: number) {
  perPage.value = n
  page.value = 1
}

// Watch filters and refetch
watch([category, source, timeFilter, view, page, perPage], () => {
  fetchArticles()
})

onMounted(() => {
  fetchArticles()
  loadSidebarData()
})

const hasFilters = computed(() => !!(category.value || source.value || search.value || timeFilter.value || view.value))
</script>

<template>
  <div class="news-page">
    <!-- Header -->
    <header class="news-header">
      <div class="header-inner">
        <a href="/" class="logo" @click.prevent="clearFilters(); fetchArticles()">
          <span class="logo-icon">📓</span>
          <span class="logo-text">Tilly's Journal</span>
        </a>

        <!-- Search -->
        <form class="search-form" @submit.prevent="onSearch">
          <div class="search-wrapper">
            <svg class="search-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="search"
              type="search"
              placeholder="Search articles..."
              class="search-input"
            />
          </div>
        </form>

        <div class="header-meta">Updated every 12 hours</div>
      </div>
    </header>

    <!-- Main -->
    <div class="news-main">
      <!-- Sidebar -->
      <ArticleSidebar
        :stats="stats"
        :sources="sources"
        :current-category="category"
        :current-source="source"
        :current-time="timeFilter"
        :current-view="view"
        @filter="setFilter"
      />

      <!-- Content -->
      <main class="news-content">
        <!-- Loading -->
        <div v-if="loading" class="loading-container">
          <div class="loading-skeleton" v-for="i in 5" :key="i"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="articles.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No articles found</h3>
          <p>Try adjusting your filters.</p>
        </div>

        <!-- Article list -->
        <div v-else class="article-list">
          <!-- Toolbar -->
          <div class="list-toolbar">
            <div>
              <span class="total-count">{{ total }} articles</span>
              <button v-if="hasFilters" class="clear-link" @click="clearFilters(); fetchArticles()">
                Clear filters
              </button>
            </div>
            <div class="toolbar-right">
              <span class="show-label">Show:</span>
              <button
                v-for="n in [20, 50, 100]"
                :key="n"
                :class="['per-page-btn', { active: perPage === n }]"
                @click="setPerPage(n)"
              >{{ n }}</button>
              <span class="expand-hint">Click to expand</span>
            </div>
          </div>

          <!-- Articles -->
          <div class="articles-container">
            <ArticleCard
              v-for="article in articles"
              :key="article.id"
              :article="article"
              @open-chat="openChat"
              @deleted="fetchArticles(); loadSidebarData()"
            />
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
            :disabled="page <= 1"
            class="page-btn"
            @click="page--"
          >&larr; Previous</button>

          <div class="page-numbers">
            <template v-for="p in totalPages" :key="p">
              <button
                v-if="p === 1 || p === totalPages || Math.abs(p - page) <= 1"
                :class="['page-num', { active: p === page }]"
                @click="page = p"
              >{{ p }}</button>
              <span v-else-if="p === 2 || p === totalPages - 1" class="page-dots">...</span>
            </template>
          </div>

          <button
            :disabled="page >= totalPages"
            class="page-btn"
            @click="page++"
          >Next &rarr;</button>
        </div>
      </main>
    </div>

    <!-- Chat Panel -->
    <ChatPanel
      v-if="chatOpen"
      :article-id="chatArticleId"
      :article-title="chatArticleTitle"
      @close="chatOpen = false"
    />

    <!-- Chat toggle -->
    <button
      v-if="!chatOpen"
      class="chat-toggle"
      title="Open AI Assistant"
      @click="chatOpen = true"
    >
      <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.news-page {
  min-height: 100vh;
  background: #f9fafb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.news-header {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 20;
  box-shadow: 0 1px 2px rgba(0,0,0,.05);
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-icon { font-size: 24px; }
.logo-text { font-weight: 700; font-size: 20px; color: #111827; }

.search-form { flex: 1; max-width: 560px; }
.search-wrapper { position: relative; }
.search-icon {
  position: absolute;
  left: 12px;
  top: 10px;
  color: #9ca3af;
}
.search-input {
  width: 100%;
  padding: 8px 16px 8px 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  background: #fff;
}
.search-input:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 2px rgba(124,58,237,.15);
}

.header-meta {
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
}

.news-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  gap: 24px;
}

.news-content {
  flex: 1;
  min-width: 0;
}

.loading-container { display: flex; flex-direction: column; gap: 12px; }
.loading-skeleton {
  height: 80px;
  background: #f3f4f6;
  border-radius: 8px;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

.empty-state {
  text-align: center;
  padding: 64px 16px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-state h3 { font-size: 18px; color: #374151; margin-bottom: 8px; }
.empty-state p { color: #6b7280; }

.article-list {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0,0,0,.05);
}

.list-toolbar {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}
.total-count { font-weight: 500; color: #111827; }
.clear-link {
  margin-left: 12px;
  color: #2563eb;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}
.clear-link:hover { text-decoration: underline; }
.toolbar-right { display: flex; align-items: center; gap: 8px; }
.show-label { color: #6b7280; font-size: 13px; }
.per-page-btn {
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  background: #f3f4f6;
  color: #4b5563;
}
.per-page-btn.active {
  background: #7c3aed;
  color: #fff;
}
.expand-hint { font-size: 12px; color: #6b7280; }

.articles-container {
  padding: 0 16px;
}

.pagination {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.page-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
}
.page-btn:disabled {
  color: #d1d5db;
  background: #f9fafb;
  cursor: not-allowed;
}
.page-btn:not(:disabled):hover { background: #f9fafb; }
.page-numbers { display: flex; align-items: center; gap: 4px; }
.page-num {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  cursor: pointer;
}
.page-num.active {
  background: #7c3aed;
  color: #fff;
  border-color: #7c3aed;
}
.page-dots { padding: 0 8px; color: #9ca3af; }

.chat-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #7c3aed;
  color: #fff;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  transition: all .2s;
}
.chat-toggle:hover {
  background: #6d28d9;
  box-shadow: 0 6px 16px rgba(0,0,0,.2);
}

@media (max-width: 768px) {
  .news-main { flex-direction: column; }
  .header-meta { display: none; }
}
</style>
