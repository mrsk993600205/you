// Stub: auth feature removed
import { defineStore } from 'pinia'
export const useAuthStore = defineStore('auth', {
  state: () => ({}),
  getters: {
    isAuthenticated: () => false
  },
  actions: {
    outlogin() {}
  }
})
