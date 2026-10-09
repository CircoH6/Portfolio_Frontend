<script setup>
import { Inbox } from '@lucide/vue'

/** État vide — message discret, aucun contenu inventé. */
defineProps({
  title: { type: String, default: 'Aucune donnée' },
  message: { type: String, default: '' },
})
</script>

<template>
  <div class="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
    <div class="flex size-12 items-center justify-center rounded-full border border-line-2 text-muted">
      <Inbox class="size-5" aria-hidden="true" />
    </div>
    <h3 class="text-lg font-semibold text-paper">{{ title }}</h3>
    <p v-if="message" class="max-w-md text-sm text-muted">{{ message }}</p>
    <slot />
  </div>
</template>
