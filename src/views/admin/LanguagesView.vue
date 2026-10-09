<script setup>
import CrudPageView from '@/components/admin/CrudPageView.vue'
import { languagesService } from '@/services/languages.service'

const service = languagesService.admin

const columns = [
  { key: 'name', label: 'Langue' },
  { key: 'level', label: 'Niveau' },
  { key: 'display_order', label: 'Ordre', align: 'right' },
]

const fields = [
  { key: 'name', label: 'Langue', type: 'text', required: true, maxlength: 100 },
  {
    key: 'level',
    label: 'Niveau',
    type: 'text',
    maxlength: 100,
    hint: 'Libellé libre saisi par vos soins (ex. : Courant, B2…). Aucun niveau n\'est inventé.',
  },
  {
    key: 'is_visible',
    label: 'Visible publiquement',
    type: 'toggle',
    hint: "L'API ne renvoie pas l'état actuel : cette valeur remplacera le réglage existant à l'enregistrement.",
  },
  { key: 'display_order', label: 'Ordre d\'affichage', type: 'number', hint: 'Plus bas = affiché en premier.' },
  { key: 'description', label: 'Précisions', type: 'textarea', rows: 3, maxlength: 500 },
]

const rules = {
  name: [{ required: true }, { max: 100 }],
  level: [{ max: 100 }],
  description: [{ max: 500 }],
}
</script>

<template>
  <CrudPageView
    title="Langues"
    description="Langues et niveaux déclarés — affichées sur la page « À propos »."
    :service="service"
    :columns="columns"
    :fields="fields"
    :rules="rules"
    create-label="Ajouter une langue"
  >
    <template #cell-level="{ item }">
      <span v-if="item.level" class="text-sm text-gold">{{ item.level }}</span>
      <span v-else class="text-sm text-muted">—</span>
    </template>
  </CrudPageView>
</template>
