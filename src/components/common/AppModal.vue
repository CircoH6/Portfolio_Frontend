<script setup>
import { watch, onMounted, onBeforeUnmount, nextTick, ref } from 'vue'
import { X } from '@lucide/vue'

/**
 * Modale — téléportée, fermeture Échap + clic extérieur,
 * focus initial, role="dialog" aria-modal.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg | xl
  closeLabel: { type: String, default: 'Fermer' },
})

const emit = defineEmits(['close'])

const dialog = ref(null)
let previousFocus = null

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

function onKeydown(event) {
  if (event.key === 'Escape' && props.open) emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

watch(
  () => props.open,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      previousFocus = document.activeElement
      await nextTick()
      dialog.value?.focus()
    } else if (previousFocus) {
      previousFocus.focus?.()
      previousFocus = null
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      @mousedown.self="emit('close')"
    >
      <div
        ref="dialog"
        class="panel w-full my-8 max-h-[calc(100vh-4rem)] overflow-y-auto p-6 focus:outline-none"
        :class="sizes[size]"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Dialogue'"
        tabindex="-1"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <h2 v-if="title" class="text-lg font-semibold text-paper">{{ title }}</h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-muted transition-colors hover:bg-ink-3 hover:text-paper"
            :aria-label="closeLabel"
            @click="emit('close')"
          >
            <X class="size-5" aria-hidden="true" />
          </button>
        </div>
        <slot />
        <div v-if="$slots.footer" class="mt-6 flex flex-wrap justify-end gap-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
