/**
 * Statuts de projet — valeurs exactes du backend (Project::STATUSES).
 * Libellés et teintes : le texte porte le sens, la couleur appuie.
 */
export const PROJECT_STATUSES = [
  'concept',
  'in_development',
  'mvp',
  'completed',
  'maintenance',
  'archived',
]

export const PROJECT_STATUS_LABELS = {
  concept: 'Concept',
  in_development: 'En développement',
  mvp: 'MVP',
  completed: 'Terminé',
  maintenance: 'Maintenance',
  archived: 'Archivé',
}

export function projectStatusTone(status) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'in_development':
    case 'mvp':
      return 'gold'
    case 'maintenance':
      return 'warning'
    case 'archived':
      return 'neutral'
    default:
      return 'neutral'
  }
}

export const PROJECT_STATUS_OPTIONS = PROJECT_STATUSES.map((value) => ({
  value,
  label: PROJECT_STATUS_LABELS[value],
}))
