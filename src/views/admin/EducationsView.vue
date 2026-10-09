<script setup>
import CrudPageView from '@/components/admin/CrudPageView.vue'
import { educationsService } from '@/services/educations.service'
import { formatDateRange } from '@/utils/dates'

const service = educationsService.admin

const columns = [
  { key: 'degree', label: 'Diplôme' },
  { key: 'institution', label: 'Établissement' },
  { key: 'field', label: 'Domaine' },
  { key: 'period', label: 'Période' },
  { key: 'display_order', label: 'Ordre', align: 'right' },
]

const fields = [
  { key: 'degree', label: 'Diplôme / qualification', type: 'text', required: true, maxlength: 255 },
  { key: 'institution', label: 'Établissement', type: 'text', required: true, maxlength: 255 },
  { key: 'field', label: 'Domaine d\'études', type: 'text', maxlength: 255 },
  { key: 'start_date', label: 'Date de début', type: 'date' },
  { key: 'end_date', label: 'Date de fin', type: 'date', hint: 'Laisser vide si en cours.' },
  { key: 'is_current', label: 'En cours', type: 'toggle' },
  {
    key: 'is_visible',
    label: 'Visible publiquement',
    type: 'toggle',
    hint: "L'API ne renvoie pas l'état actuel : cette valeur remplacera le réglage existant à l'enregistrement.",
  },
  { key: 'display_order', label: 'Ordre d\'affichage', type: 'number', hint: 'Plus bas = affiché en premier.' },
  { key: 'description', label: 'Description', type: 'textarea', rows: 5, maxlength: 20000 },
]

const rules = {
  degree: [{ required: true }, { max: 255 }],
  institution: [{ required: true }, { max: 255 }],
  field: [{ max: 255 }],
  description: [{ max: 20000 }],
}
</script>

<template>
  <CrudPageView
    title="Formations"
    description="Formations et diplômes affichés dans le parcours et sélectionnables pour les CV."
    :service="service"
    :columns="columns"
    :fields="fields"
    :rules="rules"
    create-label="Ajouter une formation"
  >
    <template #cell-period="{ item }">
      <span class="text-sm text-muted">
        {{ formatDateRange({ start: item.start_date, end: item.end_date, current: item.is_current }, { short: true }) || '—' }}
      </span>
    </template>
    <template #cell-degree="{ item }">
      <span class="font-medium">
        {{ item.degree }}
        <span v-if="item.is_current" class="ml-1 text-xs text-gold">(en cours)</span>
      </span>
    </template>
  </CrudPageView>
</template>
