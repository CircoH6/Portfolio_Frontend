import { api } from './api.js'
import { crudService } from './crud.js'

const admin = crudService('admin/projects')

/**
 * Public : GET /projects (paginé, ?featured=1, ?technology=slug, ?per_page)
 *          → data { projects, pagination }
 *          GET /projects/{slug} → ProjectResource (technologies + images)
 * Admin  : CRUD + gestion des images (multipart).
 */
export const projectsService = {
  /** @returns {Promise<{projects: Array, pagination: object}>} */
  listPublic: (params = {}) => api.get('/projects', { params }),

  getBySlug: (slug) => api.get(`/projects/${encodeURIComponent(slug)}`),

  admin,

  /** @param {FormData} form champs : image, alt, caption, display_order */
  addImage: (projectId, form) =>
    api.post(`/admin/projects/${projectId}/images`, form, { timeout: 60000 }),

  updateImage: (imageId, payload) => api.put(`/admin/project-images/${imageId}`, payload),

  deleteImage: (imageId) => api.del(`/admin/project-images/${imageId}`),
}
