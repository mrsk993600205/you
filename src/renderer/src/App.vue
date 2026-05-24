<template>
  <Provider v-if="!$route.path.includes('desktop-lyric')">
    <GlobalBackground />

    <router-view v-slot="{ Component }">
      <Transition
        :enter-active-class="`animate__animated animate__fadeIn  pagesApp`"
        :leave-active-class="`animate__animated animate__fadeOut pagesApp`"
      >
        <component :is="Component" />
      </Transition>
    </router-view>

    <!-- 一起听 Toast —— 全屏播放器未展开时新聊天走这里(节流) -->
    <!-- <LtChatToast /> -->
  </Provider>
  <router-view v-else />
  <GlobalContextMenu />
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
// import { MessagePlugin } from 'tdesign-vue-next'
import { useSettingsStore } from '@renderer/store/Settings'
// disabled: cloud/sharing
// import shareAPI from '@renderer/api/share'

const route = useRoute()
// const router = useRouter()
const settingsStore = useSettingsStore()
// 启动页路由是 '/'(welcome)；其它路由（/home/*, /settings 等）视为应用就绪
// 排除桌面歌词与识别 worker 这种独立窗口
const isAppReady = computed(() => {
  const p = route.path || ''
  if (p === '/' || p === '') return false
  if (p.startsWith('/desktop-lyric')) return false
  // if (p.startsWith('/recognition-worker')) return false
  return true
})

// disabled: cloud/sharing - DeepLinkQueue removed

// disabled: cloud/sharing - songShareQueue and playlistShareQueue removed
// disabled: cloud/sharing - watch(isAppReady) removed

// disabled: cloud/sharing - unsubShareOpen, unsubPlaylistShareOpen removed
let unsubCloseRequest: (() => void) | null = null

// 处理 Ctrl+W / Alt+F4 的关闭请求，模拟点击关闭按钮行为
const handleWindowCloseRequest = () => {
  const settings = settingsStore.settings
  if (!settings.hasConfiguredCloseBehavior) {
    // 未配置过关闭行为，通过自定义事件通知 TitleBarControls 显示对话框
    window.dispatchEvent(new CustomEvent('ikunmusic-show-close-dialog'))
    return
  }
  if (settings.closeToTray) {
    window.api?.setMiniMode(true)
  } else {
    window.api?.close()
  }
}

onMounted(async () => {
  // disabled: cloud/sharing - share event listeners removed

  // 监听主进程发送的关闭请求（Ctrl+W / Alt+F4）
  if (window.api?.windowClose?.onRequest) {
    unsubCloseRequest = window.api.windowClose.onRequest(() => handleWindowCloseRequest())
  }
})

onBeforeUnmount(() => {
  // disabled: cloud/sharing - share unsubs removed
  unsubCloseRequest?.()
  unsubCloseRequest = null
})
</script>
