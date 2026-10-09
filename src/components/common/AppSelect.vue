<script setup>
import { computed } from 'vue'
import { ChevronDown } from '@lucide/vue'

/**
 * Sélecteur natif étiqueté.
 * options : [{ value, label }] — valeur '' possible (« — Choisir — »).
 */
const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '— Choisir —' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  name: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue'])

const uid = computed(() => `field-${props.name || 'select'}-${Math.random().toString(36).slice(2, 8)}`)
const describedBy = computed(() => (props.error ? `${uid.value}-error` : undefined))
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="uid" class="text-sm font-medium text-paper">
      {{ label }}
      <span v-if="required" class="text-gold" aria-hidden="true">*</span>
    </label>
    <div class="relative">
      <select
        :id="uid"
        class="w-full appearance-none rounded-lg border bg-ink-3 px-3.5 py-2.5 pr-10 text-paper transition-colors duration-200 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none disabled:opacity-50"
        :class="error ? 'border-danger' : 'border-line'"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :name="name"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        @change="emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="String(opt.value)"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <ChevronDown
        class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
    </div>
    <p v-if="error" :id="`${uid}-error`" class="text-sm text-danger" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-sm text-muted">{{ hint }}</p>
  </div>
</template>
