import { api } from './api.js'

/**
 * Admin : GET    /admin/messages            → data { messages, pagination,
 *                                              unread_count } (filtre status)
 *         GET    /admin/messages/{id}       → détail (marque 'new' → 'read'
 *                                              côté backend à la consultation)
 *         PUT    /admin/messages/{id}       → { status } : new|read|replied|archived
 *         DELETE /admin/messages/{id}
 *
 * Consulter un message ≠ y avoir répondu : le statut « replied » n'est
 * défini que manuellement.
 */
export const messagesService = {
  list: (params = {}) => api.get('/admin/messages', { params }),
  get: (id) => api.get(`/admin/messages/${id}`),
  updateStatus: (id, status) => api.put(`/admin/messages/${id}`, { status }),
  remove: (id) => api.del(`/admin/messages/${id}`),
}

export const MESSAGE_STATUSES = ['new', 'read', 'replied', 'archived']

export const MESSAGE_STATUS_LABELS = {
  new: 'Nouveau',
  read: 'Lu',
  replied: 'Répondu',
  archived: 'Archivé',
}
