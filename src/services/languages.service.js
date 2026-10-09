import { api } from './api.js'
import { crudService } from './crud.js'

/** Public : GET /languages (visibles) · Admin : CRUD. */
export const languagesService = {
  listPublic: () => api.get('/languages'),
  admin: crudService('admin/languages'),
}
