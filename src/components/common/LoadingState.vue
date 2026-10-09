<script setup>
import AppSpinner from './AppSpinner.vue'

defineProps({
  label: { type: String, default: 'Chargement…' },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="flex items-center justify-center"
    :class="compact ? 'py-8' : 'py-20'"
    aria-live="polite"
  >
    <AppSpinner :label="label" />
  </div>
</template>
