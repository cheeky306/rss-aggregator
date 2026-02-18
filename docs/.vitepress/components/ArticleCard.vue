<script setup lang="ts">
import { ref } from 'vue'
import type { Article } from '../lib/supabase'
import { toggleFavorite, toggleReadLater, deleteArticle, getArticleById } from '../lib/articles'

const props = defineProps<{
  article: Article
}>()

const emit = defineEmits<{
  openChat: [id: string, title: string]
  deleted: []
}>()

const expanded = ref(false)
const isFavorite = ref(props.article.is_favorite || false)
const isReadLater = ref(props.article.is_read_later || false)
const fullText = ref<string | null>(null)
const loadingFullText = ref(false)
const fullTextError = ref<string | null>(null)
const deleting = ref(false)

const categoryColors: Record<string, string> = {
  agents: 'cat-violet',
  ai: 'cat-purple',
  seo: 'cat-green',
  tech: 'cat-blue',
  marketing: 'cat-orange',
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
  return date.toLocaleDateString()
}

async function onToggleFavorite(e: Event) {
  e.stopPropagation()
  isFavorite.value = await toggleFavorite(props.article.id, isFavorite.value)
}

async function onToggleReadLater(e: Event) {
  e.stopPropagation()
  isReadLater.value = await toggleReadLater(props.article.id, isReadLater.value)
}

async function onDelete(e: Event) {
  e.stopPropagation()
  if (!confirm(`Delete "${props.article.title.slice(0, 50)}..."?`)) return
  deleting.value = true
  const ok = await deleteArticle(props.article.id)
  if (ok) emit('deleted')
  deleting.value = false
}

async function loadFullText() {
  if (fullText.value || loadingFullText.value) return
  loadingFullText.value = true
  fullTextError.value = null
  const article = await getArticleById(props.article.id)
  if (article?.full_text) {
    fullText.value = article.full_text
  } else {
    fullTextError.value = 'Full text not available.'
  }
  loadingFullText.value = false
}
</script>

<template>
  <div :class="['article-card', { expanded }]">
    <!-- Collapsed view -->
    <div class="card-row">
      <div class="card-body">
        <button class="card-title" @click="expanded = !expanded">
          {{ article.title }}
        </button>

        <p v-if="!expanded && article.summary" class="card-preview">
          {{ article.summary }}
        </p>

        <div class="card-meta">
          <span :class="['cat-badge', categoryColors[article.category] || 'cat-blue']">
            {{ article.category }}
          </span>
          <span class="meta-dot">&middot;</span>
          <span class="meta-source">{{ article.source_name }}</span>
          <span class="meta-dot">&middot;</span>
          <span class="meta-time">{{ getTimeAgo(article.published_at) }}</span>
          <template v-if="article.briefing">
            <span class="meta-dot">&middot;</span>
            <span class="meta-ai">✨ AI</span>
          </template>
        </div>
      </div>

      <div class="card-actions">
        <button
          :class="['action-btn', { 'text-red': isFavorite }]"
          :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
          @click="onToggleFavorite"
        >
          <svg width="16" height="16" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button
          :class="['action-btn', { 'text-blue': isReadLater }]"
          :title="isReadLater ? 'Remove from read later' : 'Save for later'"
          @click="onToggleReadLater"
        >
          <svg width="16" height="16" :fill="isReadLater ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
        <button class="action-btn" :title="expanded ? 'Collapse' : 'Expand'" @click="expanded = !expanded">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
            :style="{ transform: expanded ? 'rotate(180deg)' : '', transition: 'transform .2s' }">
            <path d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <a :href="article.url" target="_blank" rel="noopener noreferrer" class="action-btn" title="Open original">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
          </svg>
        </a>
        <button class="action-btn action-delete" title="Delete article" :disabled="deleting" @click="onDelete">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Expanded view -->
    <div v-if="expanded" class="expanded-content">
      <!-- Summary -->
      <div v-if="article.summary" class="detail-card">
        <h4 class="detail-label">Summary</h4>
        <p class="detail-text">{{ article.summary }}</p>
      </div>

      <!-- AI Briefing -->
      <div v-if="article.briefing" class="detail-card briefing-card">
        <h4 class="detail-label briefing-label">✨ AI Briefing</h4>
        <p class="detail-text">{{ article.briefing }}</p>
      </div>

      <!-- Tags -->
      <div v-if="article.tags?.length" class="tags-row">
        <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>

      <!-- Content Ideas -->
      <div v-if="article.content_angles?.length" class="detail-card ideas-card">
        <h4 class="detail-label ideas-label">💡 Content Ideas</h4>
        <ul class="ideas-list">
          <li v-for="(angle, i) in article.content_angles" :key="i">
            <span class="idea-arrow">→</span> {{ angle }}
          </li>
        </ul>
      </div>

      <!-- Full text -->
      <details class="full-text-details" @toggle="($event.target as HTMLDetailsElement).open && loadFullText()">
        <summary class="full-text-summary">📄 View Full Article Text</summary>
        <div class="full-text-body">
          <div v-if="loadingFullText" class="full-text-loading">Loading full article...</div>
          <div v-if="fullTextError" class="full-text-error">
            {{ fullTextError }}
            <a :href="article.url" target="_blank" rel="noopener noreferrer">Read on original site →</a>
          </div>
          <div v-if="fullText" class="full-text-content" v-html="fullText"></div>
        </div>
      </details>

      <!-- Action buttons -->
      <div class="expanded-actions">
        <button class="btn-primary" @click="emit('openChat', article.id, article.title)">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Ask AI
        </button>
        <a :href="article.url" target="_blank" rel="noopener noreferrer" class="btn-dark">
          Read Original
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
          </svg>
        </a>
        <button class="btn-text" @click="expanded = false">Collapse</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.article-card {
  border-bottom: 1px solid #f3f4f6;
  transition: background .15s;
}
.article-card:hover { background: #f9fafb; }
.article-card.expanded { background: #f9fafb; }

.card-row {
  padding: 16px 0;
  display: flex;
  gap: 12px;
}

.card-body { flex: 1; min-width: 0; }

.card-title {
  font-weight: 500;
  color: #111827;
  font-size: 15px;
  line-height: 1.4;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
  padding: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-title:hover { color: #2563eb; }

.card-preview {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.cat-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid;
}
.cat-violet { background: #f3e8ff; color: #7c3aed; border-color: #c4b5fd; }
.cat-purple { background: #fae8ff; color: #a21caf; border-color: #f0abfc; }
.cat-green { background: #dcfce7; color: #15803d; border-color: #86efac; }
.cat-blue { background: #dbeafe; color: #1d4ed8; border-color: #93c5fd; }
.cat-orange { background: #ffedd5; color: #c2410c; border-color: #fdba74; }

.meta-dot { color: #d1d5db; }
.meta-source { color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta-time { color: #9ca3af; }
.meta-ai { color: #7c3aed; font-weight: 500; }

.card-actions {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: 2px;
}

.action-btn {
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  color: #d1d5db;
  transition: color .15s;
  display: flex;
  align-items: center;
  text-decoration: none;
}
.action-btn:hover { color: #6b7280; }
.action-btn.text-red { color: #ef4444; }
.action-btn.text-blue { color: #3b82f6; }
.action-delete { opacity: 0; transition: opacity .15s, color .15s; }
.card-row:hover .action-delete { opacity: 1; }
.action-delete:hover { color: #ef4444 !important; }

/* Expanded */
.expanded-content {
  padding: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}
.detail-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #6b7280;
  margin-bottom: 8px;
}
.detail-text { color: #374151; line-height: 1.7; font-size: 14px; }

.briefing-card { background: #faf5ff; border-color: #e9d5ff; }
.briefing-label { color: #7c3aed; }

.tags-row { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  padding: 4px 12px;
  background: #f3f4f6;
  color: #4b5563;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
}
.tag:hover { background: #e5e7eb; }

.ideas-card { background: #fffbeb; border-color: #fde68a; }
.ideas-label { color: #92400e; }
.ideas-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.ideas-list li { color: #78350f; font-size: 14px; display: flex; gap: 8px; }
.idea-arrow { color: #d97706; }

.full-text-details {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.full-text-summary {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
}
.full-text-summary:hover { background: #f9fafb; }
.full-text-body { padding: 0 16px 16px; }
.full-text-loading { color: #6b7280; padding: 16px 0; }
.full-text-error { color: #d97706; padding: 16px 0; }
.full-text-error a { color: #2563eb; margin-left: 8px; }
.full-text-content { color: #374151; line-height: 1.7; font-size: 14px; }

.expanded-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.btn-primary:hover { background: #6d28d9; }

.btn-dark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
}
.btn-dark:hover { background: #1f2937; }

.btn-text {
  padding: 8px 16px;
  color: #4b5563;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}
.btn-text:hover { color: #111827; }
</style>
