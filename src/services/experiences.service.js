import { api } from './api.js'
import { crudService } from './crud.js'

/** Public : GET /experiences (visibles, tri start_date desc) · Admin : CRUD. */
export const experiencesService = {
  listPublic: () => api.get('/experiences'),
  admin: crudService('admin/experiences'),
}
