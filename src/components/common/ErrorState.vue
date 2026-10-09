<script setup>
import { computed } from 'vue'
import { AlertCircle } from '@lucide/vue'
import AppButton from './AppButton.vue'

/**
 * État d'erreur — le message réseau/API est affiché tel quel
 * (aucune substitution silencieuse par de fausses données).
 */
const props = defineProps({
  error: { type: Object, default: null }, // ApiError
  title: { type: String, default: '' },
  retryable: { type: Boolean, default: true },
})

const emit = defineEmits(['retry'])

const message = computed(() => props.error?.message || 'Une erreur est survenue.')
const notFound = computed(() => props.error?.status === 404)
const heading = computed(
  () => props.title || (notFound.value ? 'Ressource introuvable' : 'Erreur de chargement'),
)
</script>

<template>
  <div
    class="panel flex flex-col items-center gap-3 px-6 py-14 text-center"
    role="alert"
  >
    <div
      class="flex size-12 items-center justify-center rounded-full border"
      :class="notFound ? 'border-line-2 text-muted' : 'border-danger/50 text-danger'"
    >
      <AlertCircle class="size-5" aria-hidden="true" />
    </div>
    <h3 class="text-lg font-semibold text-paper">{{ heading }}</h3>
    <p class="max-w-md text-sm text-muted">{{ message }}</p>
    <AppButton v-if="retryable && !notFound" variant="secondary" @click="emit('retry')">
      Réessayer
    </AppButton>
    <slot />
  </div>
</template>
