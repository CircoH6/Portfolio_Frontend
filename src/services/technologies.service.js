import { crudService } from './crud.js'

/**
 * Technologies (admin uniquement — l'API publique les expose
 * uniquement imbriquées dans les projets).
 */
export const technologiesService = crudService('admin/technologies')
