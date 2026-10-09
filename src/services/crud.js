import { api } from './api.js'

/**
 * Fabrique de service CRUD pour les apiResource Laravel.
 * Toutes les routes admin suivent `/{base}/{id}` (POST → 201, PUT → 200).
 * @param {string} base ex. 'admin/experiences'
 */
export function crudService(base) {
  return {
    /** @param {object} [config] params Axios (filtres, pagination) */
    list: (config) => api.get(`/${base}`, config),
    get: (id) => api.get(`/${base}/${id}`),
    create: (payload) => api.post(`/${base}`, payload),
    update: (id, payload) => api.put(`/${base}/${id}`, payload),
    remove: (id) => api.del(`/${base}/${id}`),
  }
}
