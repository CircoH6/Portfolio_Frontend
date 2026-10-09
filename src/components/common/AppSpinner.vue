<script setup>
defineProps({
  label: { type: String, default: 'Chargement…' },
  inline: { type: Boolean, default: false },
})
</script>

<template>
  <span
    class="inline-flex items-center gap-3"
    :class="inline ? '' : 'flex-col'"
    role="status"
  >
    <span class="spinner" aria-hidden="true" />
    <span v-if="label" class="text-sm text-muted">{{ label }}</span>
  </span>
</template>
