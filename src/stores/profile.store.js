import { defineStore } from 'pinia'
import { profileService } from '@/services/profile.service'

/**
 * Cache du profil (source unique pour header, footer, pages publiques
 * et administration — évite les requêtes répétées).
 */
export const useProfileStore = defineStore('profile', {
  state: () => ({
    publicProfile: null,
    publicStatus: 'idle', // idle | loading | success | error
    publicError: null,
    adminProfile: null,
    adminStatus: 'idle',
    adminError: null,
    saving: false,
  }),

  getters: {
    fullName: (state) =>
      state.publicProfile?.full_name ||
      [state.adminProfile?.first_name, state.adminProfile?.last_name]
        .filter(Boolean)
        .join(' ') ||
      null,
  },

  actions: {
    async fetchPublic(force = false) {
      if (this.publicStatus === 'success' && !force) return this.publicProfile
      this.publicStatus = 'loading'
      this.publicError = null
      try {
        this.publicProfile = await profileService.getPublic()
        this.publicStatus = 'success'
        return this.publicProfile
      } catch (error) {
        this.publicStatus = 'error'
        this.publicError = error
        this.publicProfile = null
        throw error
      }
    },

    async fetchAdmin(force = false) {
      if (this.adminStatus === 'success' && !force) return this.adminProfile
      this.adminStatus = 'loading'
      this.adminError = null
      try {
        this.adminProfile = await profileService.getAdmin()
        this.adminStatus = 'success'
        return this.adminProfile
      } catch (error) {
        this.adminStatus = 'error'
        this.adminError = error
        this.adminProfile = null
        throw error
      }
    },

    async updateAdmin(payload) {
      this.saving = true
      try {
        this.adminProfile = await profileService.update(payload)
        // Le profil public est la même ressource : invalidation du cache.
        this.publicStatus = 'idle'
        this.publicProfile = null
        return this.adminProfile
      } finally {
        this.saving = false
      }
    },

    /** @returns {Promise<string|null>} URL absolue de la nouvelle photo */
    async uploadPhoto(file) {
      this.saving = true
      try {
        const data = await profileService.uploadPhoto(file)
        await this.fetchAdmin(true)
        this.publicStatus = 'idle'
        this.publicProfile = null
        return data?.profile_image ?? null
      } finally {
        this.saving = false
      }
    },

    async deletePhoto() {
      this.saving = true
      try {
        await profileService.deletePhoto()
        await this.fetchAdmin(true)
        this.publicStatus = 'idle'
        this.publicProfile = null
      } finally {
        this.saving = false
      }
    },

    reset() {
      this.$reset()
    },
  },
})
