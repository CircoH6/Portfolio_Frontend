<script setup>
import { computed } from 'vue'

/**
 * Champ texte étiqueté — label explicite, erreur associée (aria-describedby).
 */
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  autocomplete: { type: String, default: undefined },
  min: { type: [String, Number], default: undefined },
  max: { type: [String, Number], default: undefined },
})

const emit = defineEmits(['update:modelValue'])

const uid = computed(() => `field-${props.name || props.type}-${Math.random().toString(36).slice(2, 8)}`)
const describedBy = computed(() => {
  const ids = []
  if (props.error) ids.push(`${uid.value}-error`)
  if (props.hint && !props.error) ids.push(`${uid.value}-hint`)
  return ids.join(' ') || undefined
})
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="uid" class="text-sm font-medium text-paper">
      {{ label }}
      <span v-if="required" class="text-gold" aria-hidden="true">*</span>
      <span v-if="required" class="sr-only">(obligatoire)</span>
    </label>
    <input
      :id="uid"
      class="w-full rounded-lg border bg-ink-3 px-3.5 py-2.5 text-paper placeholder:text-muted/60 transition-colors duration-200 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none disabled:opacity-50"
      :class="error ? 'border-danger' : 'border-line'"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :name="name"
      :autocomplete="autocomplete"
      :min="min"
      :max="max"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" :id="`${uid}-error`" class="text-sm text-danger" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${uid}-hint`" class="text-sm text-muted">
      {{ hint }}
    </p>
  </div>
</template>
