import { api } from './api.js'
import { crudService } from './crud.js'

/**
 * Public  : GET /contact { name, email, subject, message } → 201 (throttle 10/min)
 * Admin   : CRUD /admin/contact-methods (type, label, value, is_public,
 *           is_primary, display_order) — types : phone, whatsapp, email,
 *           github, linkedin, website.
 */
export const contactService = {
  send: (payload) => api.post('/contact', payload),
  methods: crudService('admin/contact-methods'),
}
