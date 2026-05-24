/**
 * 一起听 (Listen Together) — disabled
 * Stub: all callers get safe defaults (not in room, no control)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useListenTogetherStore = defineStore('listenTogether', () => {
  const connectionStatus = ref('disconnected')
  const meta = ref(null)
  const myRole = ref('member')
  const myUserId = ref('')
  const members = ref([])
  const queue = ref([])
  const pending = ref([])
  const chat = ref([])
  const current = ref(null)
  const isReconnecting = ref(false)
  const overlayVisible = ref(false)
  const fullPlayVisible = ref(false)
  const closeFullPlayRequested = ref(false)

  const isInRoom = computed(() => false)
  const canControl = computed(() => false)
  const isOwner = computed(() => false)

  const noop = () => {}
  const noopAsync = async () => {}

  return {
    connectionStatus, meta, myRole, myUserId, members, queue, pending, chat, current,
    isReconnecting, overlayVisible, fullPlayVisible, closeFullPlayRequested,
    isInRoom, canControl, isOwner,
    openOverlay: noop, closeOverlay: noop, toggleOverlay: noop,
    setFullPlayVisible: noop, requestCloseFullPlay: noop, syncRoomContextFromLocal: noop,
    connect: noop, disconnect: noop,
    createAndJoin: noopAsync, resolveAndJoin: noopAsync, joinByCode: noopAsync, leaveRoom: noop,
    play: noop, pause: noop, seek: noop, changeSong: noop,
    playQueueItem: noop, skip: noop, previous: noop,
    onSongEnded: noop, markLocalLoadingSong: noop, clearLocalLoadingSongIfMatch: noop,
    requestSong: noopAsync, addToQueue: noop, approveSong: noop, rejectSong: noop,
    removeFromQueue: noop, reorderQueue: noop, moveQueueItem: noop,
    promoteAdmin: noop, demoteAdmin: noop, kick: noop, sendChat: noop
  }
})
