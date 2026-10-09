<script setup>
/**
 * Interrupteur accessible (rôle switch) — pour booléens d'API.
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function toggle() {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label || undefined"
    :disabled="disabled"
    class="flex w-full items-start justify-between gap-4 text-left disabled:opacity-50"
    @click="toggle"
  >
    <span class="flex flex-col gap-0.5">
      <span v-if="label" class="text-sm font-medium text-paper">{{ label }}</span>
      <span v-if="hint" class="text-xs text-muted">{{ hint }}</span>
    </span>
    <span
      class="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200"
      :class="modelValue ? 'border-gold bg-gold/30' : 'border-line-2 bg-ink-3'"
      aria-hidden="true"
    >
      <span
        class="inline-block size-4 transform rounded-full transition-transform duration-200"
        :class="modelValue ? 'translate-x-6 bg-gold' : 'translate-x-1 bg-muted'"
      />
    </span>
  </button>
</template>
