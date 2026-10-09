<script setup>
import { computed } from 'vue'

/**
 * Avatar avec image dynamique (gérée depuis l'API) et repli typographique
 * cohérent avec le design lorsqu'aucune photo n'est disponible.
 */
const props = defineProps({
  src: { type: String, default: null },
  name: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg | xl
  alt: { type: String, default: '' },
})

const sizes = {
  sm: 'size-9 text-sm',
  md: 'size-12 text-base',
  lg: 'size-24 text-2xl',
  xl: 'size-32 text-3xl',
}

const initials = computed(() => {
  const parts = String(props.name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '·'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
})
</script>

<template>
  <span class="relative inline-flex shrink-0 overflow-hidden rounded-full border border-gold/40 bg-ink-3">
    <img
      v-if="src"
      :src="src"
      :alt="alt || name"
      class="h-full w-full object-cover"
      loading="lazy"
      @error="$event.target.style.display = 'none'"
    />
    <span
      v-if="!src"
      class="flex h-full w-full items-center justify-center font-serif text-gold"
      :class="sizes[size]"
      aria-hidden="true"
    >
      {{ initials }}
    </span>
  </span>
</template>
