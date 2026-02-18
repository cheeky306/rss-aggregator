<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { getArticleById } from '../lib/articles'
import { getSupabase } from '../lib/supabase'

const props = defineProps<{
  articleId: string
  articleTitle: string
}>()

const emit = defineEmits<{
  close: []
}>()

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<Message[]>([])
const input = ref('')
const loading = ref(false)
const messagesEl = ref<HTMLElement | null>(null)
const articleContext = ref('')

// Load article context when panel opens
watch(() => props.articleId, async (id) => {
  if (id) {
    const article = await getArticleById(id)
    if (article) {
      articleContext.value = [
        `Title: ${article.title}`,
        `Source: ${article.source_name}`,
        `Category: ${article.category}`,
        article.briefing ? `Briefing: ${article.briefing}` : '',
        article.summary ? `Summary: ${article.summary}` : '',
        article.full_text ? `Full Text: ${article.full_text.slice(0, 3000)}` : '',
      ].filter(Boolean).join('\n')
    }
    messages.value = []
  }
}, { immediate: true })

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

async function send() {
  const text = input.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  loading.value = true
  scrollToBottom()

  try {
    // Call Supabase Edge Function
    const { data: { session } } = await getSupabase().auth.getSession()

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: messages.value.map(m => ({ role: m.role, content: m.content })),
          articleContext: articleContext.value,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status}`)
    }

    const result = await response.json()
    messages.value.push({ role: 'assistant', content: result.reply })
  } catch (error) {
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.',
    })
    console.error('Chat error:', error)
  }

  loading.value = false
  scrollToBottom()
}
</script>

<template>
  <div class="chat-panel">
    <!-- Header -->
    <div class="chat-header">
      <div class="chat-header-info">
        <h3 class="chat-title">AI Assistant</h3>
        <p v-if="articleTitle" class="chat-subtitle">{{ articleTitle }}</p>
      </div>
      <button class="chat-close" @click="emit('close')">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Messages -->
    <div ref="messagesEl" class="chat-messages">
      <div v-if="messages.length === 0" class="chat-empty">
        <p>Ask me anything about this article.</p>
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="['chat-msg', msg.role]"
      >
        <div class="msg-bubble">{{ msg.content }}</div>
      </div>
      <div v-if="loading" class="chat-msg assistant">
        <div class="msg-bubble typing">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>

    <!-- Input -->
    <form class="chat-input-form" @submit.prevent="send">
      <input
        v-model="input"
        type="text"
        placeholder="Ask about this article..."
        class="chat-input"
        :disabled="loading"
      />
      <button type="submit" class="chat-send" :disabled="loading || !input.trim()">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
      </button>
    </form>
  </div>
</template>

<style scoped>
.chat-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: #fff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  z-index: 50;
  box-shadow: -4px 0 12px rgba(0,0,0,.1);
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.chat-title { font-weight: 600; font-size: 16px; color: #111827; }
.chat-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.chat-close {
  padding: 4px;
  border: none;
  background: none;
  cursor: pointer;
  color: #6b7280;
  flex-shrink: 0;
}
.chat-close:hover { color: #111827; }

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-empty {
  text-align: center;
  color: #9ca3af;
  padding: 48px 16px;
  font-size: 14px;
}

.chat-msg { display: flex; }
.chat-msg.user { justify-content: flex-end; }
.chat-msg.assistant { justify-content: flex-start; }

.msg-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}
.user .msg-bubble { background: #7c3aed; color: #fff; }
.assistant .msg-bubble { background: #f3f4f6; color: #111827; }

.typing {
  display: flex;
  gap: 4px;
  padding: 14px 18px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  animation: bounce 1.4s infinite;
}
.dot:nth-child(2) { animation-delay: .2s; }
.dot:nth-child(3) { animation-delay: .4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input-form {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
}
.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.chat-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124,58,237,.15); }
.chat-send {
  padding: 10px;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.chat-send:disabled { opacity: .5; cursor: not-allowed; }
.chat-send:not(:disabled):hover { background: #6d28d9; }

@media (max-width: 768px) {
  .chat-panel { width: 100%; }
}
</style>
