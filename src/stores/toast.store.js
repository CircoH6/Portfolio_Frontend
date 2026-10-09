import { defineStore } from 'pinia'

let uid = 0

/** Notifications éphémères (aria-live dans ToastHost). */
export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [], // { id, type, message, timeout }
  }),

  actions: {
    push(type, message, timeout = 5000) {
      const id = ++uid
      this.toasts.push({ id, type, message })
      if (timeout > 0) {
        setTimeout(() => this.dismiss(id), timeout)
      }
      return id
    },

    success(message) {
      return this.push('success', message)
    },

    error(message) {
      return this.push('error', message, 8000)
    },

    info(message) {
      return this.push('info', message)
    },

    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
  },
})
