<script setup lang="ts">
defineProps<{
  stats: {
    totalArticles: number
    todayArticles: number
    favoriteCount: number
    readLaterCount: number
    byCategory: Record<string, number>
  }
  sources: Record<string, number>
  currentCategory: string
  currentSource: string
  currentTime: string
  currentView: string
}>()

const emit = defineEmits<{
  filter: [key: string, value: string]
}>()

const categories = [
  { key: 'agents', label: '🤖 AI Agents', color: 'violet' },
  { key: 'ai', label: '🧠 AI & ML', color: 'purple' },
  { key: 'seo', label: '🔍 SEO & Search', color: 'green' },
  { key: 'tech', label: '💻 Tech News', color: 'blue' },
  { key: 'marketing', label: '📈 Marketing', color: 'orange' },
]

const timeFilters = [
  { key: '', label: 'All Time' },
  { key: 'today', label: '📅 Today' },
  { key: 'yesterday', label: '🕙 Yesterday' },
  { key: 'week', label: '📆 This Week' },
  { key: 'month', label: '🗓️ This Month' },
]
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-inner">
      <!-- Stats -->
      <div class="sidebar-card">
        <div class="stat-number">{{ stats.totalArticles }}</div>
        <div class="stat-label">Total Articles</div>
        <div class="stat-today">{{ stats.todayArticles }} today</div>
      </div>

      <!-- Saved -->
      <div class="sidebar-card">
        <h3 class="card-title">Saved</h3>
        <button
          :class="['sidebar-link', { active: currentView === 'favorites' }]"
          @click="emit('filter', 'view', currentView === 'favorites' ? '' : 'favorites')"
        >
          <span class="link-label">
            <svg width="16" height="16" :fill="currentView === 'favorites' ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color: #ef4444;">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Favorites
          </span>
          <span class="link-count">{{ stats.favoriteCount }}</span>
        </button>
        <button
          :class="['sidebar-link', { active: currentView === 'read-later' }]"
          @click="emit('filter', 'view', currentView === 'read-later' ? '' : 'read-later')"
        >
          <span class="link-label">
            <svg width="16" height="16" :fill="currentView === 'read-later' ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color: #3b82f6;">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Read Later
          </span>
          <span class="link-count">{{ stats.readLaterCount }}</span>
        </button>
      </div>

      <!-- Time -->
      <div class="sidebar-card">
        <h3 class="card-title">Time</h3>
        <button
          v-for="t in timeFilters"
          :key="t.key"
          :class="['sidebar-link', { active: currentTime === t.key }]"
          @click="emit('filter', 'time', currentTime === t.key ? '' : t.key)"
        >{{ t.label }}</button>
      </div>

      <!-- Categories -->
      <div class="sidebar-card">
        <h3 class="card-title">Categories</h3>
        <button
          :class="['sidebar-link', { active: !currentCategory && !currentView }]"
          @click="emit('filter', 'category', '')"
        >All Categories</button>
        <button
          v-for="cat in categories"
          :key="cat.key"
          :class="['sidebar-link', { active: currentCategory === cat.key }]"
          @click="emit('filter', 'category', currentCategory === cat.key ? '' : cat.key)"
        >
          <span>{{ cat.label }}</span>
          <span class="link-count">{{ stats.byCategory[cat.key] || 0 }}</span>
        </button>
      </div>

      <!-- Sources -->
      <div class="sidebar-card">
        <h3 class="card-title">Sources</h3>
        <div class="sources-scroll">
          <button
            :class="['sidebar-link', { active: !currentSource }]"
            @click="emit('filter', 'source', '')"
          >All Sources</button>
          <button
            v-for="[name, count] in Object.entries(sources).sort((a, b) => b[1] - a[1])"
            :key="name"
            :class="['sidebar-link', { active: currentSource === name }]"
            :title="name"
            @click="emit('filter', 'source', currentSource === name ? '' : name)"
          >
            <span class="source-name">{{ name }}</span>
            <span class="link-count">{{ count }}</span>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 256px;
  flex-shrink: 0;
}

.sidebar-inner {
  position: sticky;
  top: 68px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,.05);
  border: 1px solid #e5e7eb;
}

.stat-number { font-size: 24px; font-weight: 700; color: #111827; }
.stat-label { font-size: 14px; color: #6b7280; }
.stat-today { margin-top: 8px; font-size: 14px; color: #16a34a; font-weight: 500; }

.card-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
  font-size: 14px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  color: #374151;
  transition: background .15s;
}
.sidebar-link:hover { background: #f9fafb; }
.sidebar-link.active { background: #f3f4f6; font-weight: 500; }

.link-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-count { color: #9ca3af; font-size: 13px; }

.sources-scroll {
  max-height: 256px;
  overflow-y: auto;
}

.source-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

@media (max-width: 768px) {
  .sidebar { width: 100%; }
  .sidebar-inner { position: static; flex-direction: row; flex-wrap: wrap; gap: 8px; }
  .sidebar-card { flex: 1; min-width: 200px; }
}
</style>
