import { api } from './api.js'
import { crudService } from './crud.js'

/** Public : GET /certifications (visibles) · Admin : CRUD. */
export const certificationsService = {
  listPublic: () => api.get('/certifications'),
  admin: crudService('admin/certifications'),
}
