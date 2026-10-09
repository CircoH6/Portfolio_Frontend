import { api } from './api.js'
import { crudService } from './crud.js'

/** Public : GET /educations (visibles) · Admin : CRUD. */
export const educationsService = {
  listPublic: () => api.get('/educations'),
  admin: crudService('admin/educations'),
}
