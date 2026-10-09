import { api } from './api.js'
import { crudService } from './crud.js'

/**
 * Public : GET /cv            → versions publiques (CvProfileResource[])
 *          GET /cv/{slug}     → CV Data (pipeline CvBuilderService —
 *                                même structure que le PDF, éléments masqués
 *                                et show_* déjà appliqués)
 *          GET /cv/{slug}/pdf → téléchargement DomPDF (Content-Disposition)
 * Admin  : CRUD /admin/cv (sélections project_ids[] / skill_ids[] /
 *          experience_ids[] / education_ids[] / certification_ids[]
 *          ORDONNÉES = ordre d'affichage) + GET /admin/cv/{id}/pdf.
 */
export const cvService = {
  listPublic: () => api.get('/cv'),
  getBySlug: (slug) => api.get(`/cv/${encodeURIComponent(slug)}`),
  downloadPublicPdf: (slug) => api.download(`/cv/${encodeURIComponent(slug)}/pdf`),

  admin: crudService('admin/cv'),
  downloadAdminPdf: (id) => api.download(`/admin/cv/${id}/pdf`),
}
