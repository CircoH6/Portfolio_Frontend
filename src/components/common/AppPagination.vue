<script setup>
import { ChevronLeft, ChevronRight } from '@lucide/vue'

/**
 * Pagination — format identique à la meta `pagination` du backend
 * { current_page, per_page, total, last_page }.
 */
const props = defineProps({
  pagination: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])

function go(page) {
  if (props.disabled) return
  if (page < 1 || page > props.pagination.last_page) return
  emit('change', page)
}
</script>

<template>
  <nav
    v-if="pagination && pagination.last_page > 1"
    class="flex flex-wrap items-center justify-between gap-4"
    aria-label="Pagination"
  >
    <p class="text-sm text-muted">
      Page {{ pagination.current_page }} sur {{ pagination.last_page }}
      <span aria-hidden="true">·</span>
      {{ pagination.total }} résultat{{ pagination.total > 1 ? 's' : '' }}
    </p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-lg border border-line-2 px-3 py-1.5 text-sm text-paper transition-colors hover:border-gold hover:text-gold disabled:opacity-40 disabled:hover:border-line-2 disabled:hover:text-paper"
        :disabled="disabled || pagination.current_page <= 1"
        @click="go(pagination.current_page - 1)"
      >
        <ChevronLeft class="size-4" aria-hidden="true" />
        Précédent
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-lg border border-line-2 px-3 py-1.5 text-sm text-paper transition-colors hover:border-gold hover:text-gold disabled:opacity-40 disabled:hover:border-line-2 disabled:hover:text-paper"
        :disabled="disabled || pagination.current_page >= pagination.last_page"
        @click="go(pagination.current_page + 1)"
      >
        Suivant
        <ChevronRight class="size-4" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>
