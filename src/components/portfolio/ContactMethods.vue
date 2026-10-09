<script setup>
import { computed } from 'vue'
import { Mail, Phone, MessageCircle, Globe } from '@lucide/vue'
import IconGithub from '@/components/common/IconGithub.vue'
import IconLinkedin from '@/components/common/IconLinkedin.vue'
import { buildContactHref, CONTACT_TYPE_META } from '@/utils/contact-links'

/**
 * Liste de moyens de contact publique — protocoles corrects
 * (tel:, mailto:, wa.me, https) d'après les données du profil API.
 */
const props = defineProps({
  methods: { type: Array, default: () => [] },
  layout: { type: String, default: 'list' }, // list | inline
})

const items = computed(() =>
  props.methods
    .map((method) => ({
      ...method,
      href: buildContactHref(method.type, method.value),
      icon: iconFor(method.type),
      meta: CONTACT_TYPE_META[method.type] || { label: method.type },
    }))
    .filter((method) => method.href),
)

function iconFor(type) {
  if (type === 'github') return IconGithub
  if (type === 'linkedin') return IconLinkedin
  if (type === 'phone') return Phone
  if (type === 'whatsapp') return MessageCircle
  if (type === 'email') return Mail
  if (type === 'website') return Globe
  return Mail
}
</script>

<template>
  <ul
    :class="layout === 'inline' ? 'flex flex-wrap gap-3' : 'flex flex-col gap-3'"
    aria-label="Moyens de contact"
  >
    <li v-for="method in items" :key="method.id || method.value">
      <a
        :href="method.href"
        class="group flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm transition-colors duration-200 hover:border-gold/50"
        :class="layout === 'inline' ? '' : 'w-full'"
        :target="method.href.startsWith('http') ? '_blank' : undefined"
        :rel="method.href.startsWith('http') ? 'noopener noreferrer' : undefined"
      >
        <span class="flex size-9 shrink-0 items-center justify-center rounded-full border border-line-2 text-gold transition-colors group-hover:border-gold">
          <component :is="method.icon" class="size-4" aria-hidden="true" />
        </span>
        <span class="flex min-w-0 flex-col">
          <span class="text-xs uppercase tracking-wide text-muted">
            {{ method.label || method.meta.label }}
          </span>
          <span class="truncate text-paper">{{ method.value }}</span>
        </span>
      </a>
    </li>
    <li v-if="items.length === 0" class="text-sm text-muted">
      Aucune coordonnée publique disponible.
    </li>
  </ul>
</template>
