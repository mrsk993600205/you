<script setup lang="ts">
import { ref, watch, computed, toRaw } from 'vue'
import { storeToRefs } from 'pinia'
import { useGlobalPlayStatusStore } from '@renderer/store/GlobalPlayStatus'
import type { Comment } from '@renderer/store/GlobalPlayStatus'
import { CloseIcon, ChatBubbleIcon } from 'tdesign-icons-vue-next'

const props = withDefaults(
  defineProps<{
    show: boolean
    mainColor?: string
  }>(),
  {
    mainColor: 'var(--td-brand-color)'
  }
)

const emit = defineEmits(['close'])

const globalPlayStatus = useGlobalPlayStatusStore()
const { player } = storeToRefs(globalPlayStatus)

const activeTab = ref<'hot' | 'latest'>('hot')

const comments = computed(() =>
  activeTab.value === 'hot'
    ? player.value.comments.hotList
    : player.value.comments.latestList
)

const total = computed(() =>
  activeTab.value === 'hot'
    ? player.value.comments.hotTotal
    : player.value.comments.latestTotal
)

const isLoading = computed(() =>
  activeTab.value === 'hot'
    ? player.value.comments.hotIsLoading
    : player.value.comments.latestIsLoading
)

const currentPage = computed(() =>
  activeTab.value === 'hot'
    ? player.value.comments.hotPage
    : player.value.comments.latestPage
)

const maxPage = computed(() =>
  activeTab.value === 'hot'
    ? player.value.comments.hotMaxPage
    : player.value.comments.latestMaxPage
)

const hasMore = computed(() => currentPage.value < maxPage.value)

const switchTab = (tab: 'hot' | 'latest') => {
  activeTab.value = tab
  const list = tab === 'hot' ? player.value.comments.hotList : player.value.comments.latestList
  if (list.length === 0) {
    globalPlayStatus.fetchComments(1, tab)
  }
}

const loadMore = () => {
  if (isLoading.value || !hasMore.value) return
  globalPlayStatus.fetchComments(currentPage.value + 1, activeTab.value)
}

const formatTime = (ts: number): string => {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const songTitle = computed(() => {
  const info = player.value.songInfo
  if (!info) return ''
  return info.name || ''
})

const artist = computed(() => {
  const info = player.value.songInfo
  if (!info) return ''
  return info.singer || ''
})

watch(
  () => props.show,
  (v) => {
    if (v) {
      if (player.value.comments.hotList.length === 0) {
        globalPlayStatus.fetchComments(1, 'hot')
      }
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade-overlay">
      <div v-show="show" class="comments-overlay" @click.self="$emit('close')">
        <div class="comments-card">
          <!-- Header -->
          <div class="header">
            <div class="title">
              <span class="title-main">评论</span>
              <span v-if="songTitle" class="title-sub">
                · {{ songTitle }}<span v-if="artist"> - {{ artist }}</span>
              </span>
            </div>
            <button class="close-btn" @click="$emit('close')">
              <CloseIcon size="22" />
            </button>
          </div>

          <!-- Tabs -->
          <div class="tabs">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'hot' }"
              @click="switchTab('hot')"
            >
              热门评论
              <span v-if="player.comments.hotTotal" class="tab-count">
                {{ player.comments.hotTotal }}
              </span>
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'latest' }"
              @click="switchTab('latest')"
            >
              最新评论
              <span v-if="player.comments.latestTotal" class="tab-count">
                {{ player.comments.latestTotal }}
              </span>
            </button>
          </div>

          <!-- Content -->
          <div class="content" @scroll.passive="() => {}">
            <div v-if="isLoading && comments.length === 0" class="loading-state">
              <div class="spinner" />
              <span>加载评论中...</span>
            </div>

            <div v-else-if="!isLoading && comments.length === 0" class="empty-state">
              <ChatBubbleIcon size="40" />
              <span>暂无评论</span>
            </div>

            <ul v-else class="comment-list">
              <li
                v-for="comment in comments"
                :key="comment.id"
                class="comment-item"
              >
                <img
                  :src="comment.avatar"
                  class="comment-avatar"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
                <div class="comment-body">
                  <div class="comment-meta">
                    <span class="comment-username">{{ comment.userName }}</span>
                    <span class="comment-time">{{ comment.timeStr || formatTime(comment.time) }}</span>
                    <span v-if="comment.location" class="comment-location">
                      · {{ comment.location }}
                    </span>
                  </div>
                  <div class="comment-text">{{ comment.text }}</div>
                  <div v-if="comment.images?.length" class="comment-images">
                    <img
                      v-for="(img, idx) in comment.images"
                      :key="idx"
                      :src="img"
                      class="comment-img"
                      @error="($event.target as HTMLImageElement).style.display = 'none'"
                    />
                  </div>
                  <!-- Replies -->
                  <div v-if="comment.reply?.length" class="comment-replies">
                    <div
                      v-for="reply in comment.reply"
                      :key="reply.id"
                      class="reply-item"
                    >
                      <span class="reply-username">{{ reply.userName }}</span>
                      <span v-if="reply.reply?.length">
                        <span class="reply-sep">回复</span>
                        <span class="reply-username">{{ reply.reply[0]?.userName }}</span>
                      </span>
                      <span class="reply-sep">: </span>
                      <span class="reply-text">{{ reply.text }}</span>
                    </div>
                  </div>
                </div>
                <div class="comment-likes">
                  <span v-if="comment.likedCount" class="likes-count">
                    {{ comment.likedCount }}
                  </span>
                </div>
              </li>
            </ul>

            <!-- Load more -->
            <div v-if="comments.length > 0" class="load-more-area">
              <button
                v-if="hasMore"
                class="load-more-btn"
                :disabled="isLoading"
                @click="loadMore"
              >
                <span v-if="isLoading" class="spinner-sm" />
                {{ isLoading ? '加载中...' : '加载更多' }}
              </button>
              <span v-else class="no-more">没有更多评论了</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.comments-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
}

.comments-card {
  width: min(720px, 80vw);
  height: min(80vh, 820px);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(60px);
  -webkit-backdrop-filter: blur(60px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #fff;
}

.header {
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.1);

  .title {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
  }
  .title-main {
    font-size: 17px;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .title-sub {
    font-size: 13px;
    opacity: 0.65;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 380px;
  }
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  padding: 0 18px;
}

.tab-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 12px 16px;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 2px;
    border-radius: 1px;
    background: v-bind('props.mainColor');
    opacity: 0;
    transform: scaleX(0);
    transition: all 0.2s;
  }

  &.active {
    color: #fff;
    &::after {
      opacity: 1;
      transform: scaleX(1);
    }
  }

  &:hover:not(.active) {
    color: rgba(255, 255, 255, 0.8);
  }
}

.tab-count {
  font-size: 12px;
  opacity: 0.55;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 0 18px;

  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  opacity: 0.5;
  font-size: 14px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.comment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06);
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.comment-username {
  color: rgba(255, 255, 255, 0.7);
}

.comment-time,
.comment-location {
  color: rgba(255, 255, 255, 0.4);
}

.comment-text {
  font-size: 14px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.9);
  word-break: break-word;
}

.comment-images {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.comment-img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
}

.comment-likes {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.likes-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.comment-replies {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.reply-item {
  font-size: 13px;
  line-height: 1.45;
  padding: 2px 0;

  & + & {
    margin-top: 4px;
  }
}

.reply-username {
  color: rgba(255, 255, 255, 0.65);
}

.reply-sep {
  color: rgba(255, 255, 255, 0.35);
}

.reply-text {
  color: rgba(255, 255, 255, 0.8);
}

.load-more-area {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 6px 20px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.no-more {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
}

.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}
</style>
