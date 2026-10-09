import { defineStore } from 'pinia'

/**
 * Confirmation d'actions sensibles (suppression…) :
 *   const ok = await confirm({ message: 'Supprimer … ?' })
 * Résolu par ConfirmDialog.vue.
 */
export const useConfirmStore = defineStore('confirm', {
  state: () => ({
    pending: null, // { title, message, confirmLabel, cancelLabel, danger, resolve }
  }),

  actions: {
    confirm({
      title = 'Confirmer',
      message = 'Cette action est définitive.',
      confirmLabel = 'Confirmer',
      cancelLabel = 'Annuler',
      danger = true,
    } = {}) {
      return new Promise((resolve) => {
        this.pending = { title, message, confirmLabel, cancelLabel, danger, resolve }
      })
    },

    settle(value) {
      const pending = this.pending
      this.pending = null
      pending?.resolve(value)
    },
  },
})
