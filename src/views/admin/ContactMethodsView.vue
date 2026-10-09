<script setup>
import CrudPageView from '@/components/admin/CrudPageView.vue'
import { contactService } from '@/services/contact.service'
import { CONTACT_TYPE_META } from '@/utils/contact-links'
import IconGithub from '@/components/common/IconGithub.vue'
import IconLinkedin from '@/components/common/IconLinkedin.vue'

const service = contactService.methods

const typeOptions = Object.entries(CONTACT_TYPE_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

const columns = [
  { key: 'type', label: 'Type' },
  { key: 'label', label: 'Libellé' },
  { key: 'value', label: 'Valeur' },
  { key: 'display_order', label: 'Ordre', align: 'right' },
]

const fields = [
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: typeOptions,
  },
  { key: 'label', label: 'Libellé', type: 'text', required: true, maxlength: 100, hint: 'Texte affiché publiquement (ex. : E-mail professionnel).' },
  { key: 'value', label: 'Valeur', type: 'text', required: true, maxlength: 255, hint: 'Numéro, adresse e-mail ou URL — les protocoles (tel:, mailto:, wa.me) sont générés automatiquement.' },
  {
    key: 'is_primary',
    label: 'Méthode principale',
    type: 'toggle',
    hint: 'Reconnue par l\'API comme contact prioritaire.',
  },
  {
    key: 'is_public',
    label: 'Visible publiquement',
    type: 'toggle',
    hint: "L'API ne renvoie pas l'état actuel : cette valeur remplacera le réglage existant à l'enregistrement.",
  },
  { key: 'display_order', label: 'Ordre d\'affichage', type: 'number', hint: 'Plus bas = affiché en premier.' },
]

const rules = {
  type: [{ required: true }],
  label: [{ required: true }, { max: 100 }],
  value: [{ required: true }, { max: 255 }],
}
</script>

<template>
  <CrudPageView
    title="Moyens de contact"
    description="Coordonnées publiques du site (téléphone, WhatsApp, e-mail, GitHub, LinkedIn, site web). Les liens sont générés avec les protocoles appropriés."
    :service="service"
    :columns="columns"
    :fields="fields"
    :rules="rules"
    create-label="Ajouter un moyen de contact"
  >
    <template #cell-type="{ item }">
      <span class="inline-flex items-center gap-2 text-sm">
        <IconGithub v-if="item.type === 'github'" class="size-4" aria-hidden="true" />
        <IconLinkedin v-else-if="item.type === 'linkedin'" class="size-4" aria-hidden="true" />
        {{ CONTACT_TYPE_META[item.type]?.label || item.type }}
        <span v-if="item.is_primary" class="text-xs text-gold">(principal)</span>
      </span>
    </template>
    <template #cell-value="{ item }">
      <span class="break-all text-sm">{{ item.value }}</span>
    </template>
  </CrudPageView>
</template>
