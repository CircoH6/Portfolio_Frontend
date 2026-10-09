<script setup>
import CrudPageView from '@/components/admin/CrudPageView.vue'
import { experiencesService } from '@/services/experiences.service'
import { formatDateRange } from '@/utils/dates'

const service = experiencesService.admin

const columns = [
  { key: 'title', label: 'Poste' },
  { key: 'company', label: 'Entreprise' },
  { key: 'location', label: 'Lieu' },
  { key: 'period', label: 'Période' },
  { key: 'display_order', label: 'Ordre', align: 'right' },
]

const fields = [
  { key: 'title', label: 'Intitulé du poste', type: 'text', required: true, maxlength: 255 },
  { key: 'company', label: 'Entreprise', type: 'text', required: true, maxlength: 255 },
  { key: 'location', label: 'Lieu', type: 'text', maxlength: 255 },
  { key: 'start_date', label: 'Date de début', type: 'date' },
  { key: 'end_date', label: 'Date de fin', type: 'date', hint: 'Laisser vide si en cours.' },
  { key: 'is_current', label: 'Poste en cours', type: 'toggle', hint: 'Affiché « aujourd\'hui » sur le site et le CV.' },
  {
    key: 'is_visible',
    label: 'Visible publiquement',
    type: 'toggle',
    hint: "L'API ne renvoie pas l'état actuel de visibilité : cette valeur remplacera le réglage existant à l'enregistrement.",
  },
  { key: 'display_order', label: 'Ordre d\'affichage', type: 'number', hint: 'Plus bas = affiché en premier.' },
  { key: 'description', label: 'Description', type: 'textarea', rows: 6, maxlength: 20000 },
]

const rules = {
  title: [{ required: true }, { max: 255 }],
  company: [{ required: true }, { max: 255 }],
  location: [{ max: 255 }],
  description: [{ max: 20000 }],
}
</script>

<template>
  <CrudPageView
    title="Expériences"
    description="Expériences professionnelles affichées dans le parcours et sélectionnables pour les CV."
    :service="service"
    :columns="columns"
    :fields="fields"
    :rules="rules"
    create-label="Ajouter une expérience"
  >
    <template #cell-period="{ item }">
      <span class="text-sm text-muted">
        {{ formatDateRange({ start: item.start_date, end: item.end_date, current: item.is_current }) || '—' }}
      </span>
    </template>
    <template #cell-title="{ item }">
      <span class="font-medium">
        {{ item.title }}
        <span v-if="item.is_current" class="ml-1 text-xs text-gold">(en cours)</span>
      </span>
    </template>
  </CrudPageView>
</template>
