import { api } from './api.js'
import { crudService } from './crud.js'

/**
 * Public : GET /skills → SkillResource[] (is_visible=true) avec `category`
 * Admin  : CRUD /admin/skill-categories (index inclut les skills)
 *          CRUD /admin/skills
 */
export const skillsService = {
  listPublic: () => api.get('/skills'),

  categories: crudService('admin/skill-categories'),
  admin: crudService('admin/skills'),
}
