<script setup>
import { CheckCircle2, AlertCircle, Info, X } from '@lucide/vue'
import { useToastStore } from '@/stores/toast.store'

const store = useToastStore()

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const tones = {
  success: 'border-success/50 text-success',
  error: 'border-danger/50 text-danger',
  info: 'border-gold/50 text-gold',
}
</script>

<template>
  <Teleport to="body">
    <!-- aria-live : les notifications sont annoncées par les lecteurs d'écran -->
    <div
      class="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      <div
        v-for="toast in store.toasts"
        :key="toast.id"
        class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface px-4 py-3 shadow-pop"
        :class="tones[toast.type] || tones.info"
        role="status"
      >
        <component :is="icons[toast.type] || Info" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p class="flex-1 text-sm text-paper">{{ toast.message }}</p>
        <button
          type="button"
          class="rounded p-1 text-muted transition-colors hover:text-paper"
          aria-label="Fermer la notification"
          @click="store.dismiss(toast.id)"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
