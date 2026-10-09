<script setup>
import CrudPageView from '@/components/admin/CrudPageView.vue'
import { certificationsService } from '@/services/certifications.service'
import { formatMonthYear } from '@/utils/dates'

const service = certificationsService.admin

const columns = [
  { key: 'name', label: 'Certification' },
  { key: 'organization', label: 'Organisme' },
  { key: 'issued', label: 'Délivrance' },
  { key: 'expires', label: 'Expiration' },
  { key: 'display_order', label: 'Ordre', align: 'right' },
]

const fields = [
  { key: 'name', label: 'Nom', type: 'text', required: true, maxlength: 255 },
  { key: 'organization', label: 'Organisme', type: 'text', required: true, maxlength: 255 },
  { key: 'issue_date', label: 'Date de délivrance', type: 'date' },
  { key: 'expiration_date', label: 'Date d\'expiration', type: 'date' },
  { key: 'credential_url', label: 'URL du credential', type: 'url', maxlength: 255, placeholder: 'https://…' },
  {
    key: 'is_visible',
    label: 'Visible publiquement',
    type: 'toggle',
    hint: "L'API ne renvoie pas l'état actuel : cette valeur remplacera le réglage existant à l'enregistrement.",
  },
  { key: 'display_order', label: 'Ordre d\'affichage', type: 'number', hint: 'Plus bas = affiché en premier.' },
  { key: 'description', label: 'Description', type: 'textarea', rows: 4, maxlength: 20000 },
]

const rules = {
  name: [{ required: true }, { max: 255 }],
  organization: [{ required: true }, { max: 255 }],
  credential_url: [{ url: true }, { max: 255 }],
  description: [{ max: 20000 }],
}
</script>

<template>
  <CrudPageView
    title="Certifications"
    description="Certifications et habilitations — affichées sur le parcours et sélectionnables pour les CV."
    :service="service"
    :columns="columns"
    :fields="fields"
    :rules="rules"
    create-label="Ajouter une certification"
  >
    <template #cell-issued="{ item }">
      <span class="text-sm text-muted">{{ formatMonthYear(item.issue_date) || '—' }}</span>
    </template>
    <template #cell-expires="{ item }">
      <span class="text-sm text-muted">{{ formatMonthYear(item.expiration_date) || '—' }}</span>
    </template>
  </CrudPageView>
</template>
