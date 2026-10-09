<script setup>
import { computed } from 'vue'

/** Étiquette de statut — jamais de couleur seule : le texte porte le sens. */
const props = defineProps({
  tone: { type: String, default: 'neutral' }, // neutral | gold | success | danger | warning
  dot: { type: Boolean, default: false },
})

const tones = {
  neutral: 'border-line-2 text-muted',
  gold: 'border-gold/50 text-gold',
  success: 'border-success/50 text-success',
  danger: 'border-danger/50 text-danger',
  warning: 'border-warning/50 text-warning',
}

const classes = computed(() => [
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
  tones[props.tone] || tones.neutral,
])
</script>

<template>
  <span :class="classes">
    <span v-if="dot" class="size-1.5 rounded-full bg-current" aria-hidden="true" />
    <slot />
  </span>
</template>
