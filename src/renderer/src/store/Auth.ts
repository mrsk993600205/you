// disabled: login system removed
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref(null)
    const isAuthenticated = ref(false)
    const loading = ref(false)

    const noop = () => {}
    const noopAsync = async () => {}

    return {
      user,
      isAuthenticated,
      loading,
      init: noopAsync,
      login: noop,
      logout: noop,
      handleCallback: noopAsync,
      updateUserInfo: noopAsync,
      updateProfile: noopAsync,
      uploadAvatar: noopAsync,
      outlogin: noop
    }
  },
  {
    persist: true
  }
)
