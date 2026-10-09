import { api } from './api.js'

/**
 * GET  /profile                  → ProfileResource (contact methods publiques)
 * GET  /admin/profile            → profil de l'utilisateur connecté
 * PUT  /admin/profile            → UpdateProfileRequest
 * POST /admin/profile/photo      → multipart { photo: jpg|png|webp ≤ 4 Mo }
 * DELETE /admin/profile/photo    → suppression
 */
export const profileService = {
  getPublic: () => api.get('/profile'),

  getAdmin: () => api.get('/admin/profile'),

  update: (payload) => api.put('/admin/profile', payload),

  /** @param {File} file */
  uploadPhoto(file) {
    const form = new FormData()
    form.append('photo', file)
    // Pas de Content-Type manuel : Axios gère le multipart.
    return api.post('/admin/profile/photo', form, { timeout: 60000 })
  },

  deletePhoto: () => api.del('/admin/profile/photo'),
}
