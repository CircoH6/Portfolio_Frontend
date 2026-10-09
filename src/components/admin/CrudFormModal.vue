<script setup>
import { reactive, watch, computed } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'
import AppButton from '@/components/common/AppButton.vue'

/**
 * Modale de formulaire générique pilotée par une configuration de champs :
 * { key, label, type, required, options, rows, hint, maxlength, placeholder,
 *   placeholderDate }
 * types : text | url | email | textarea | date | select | toggle | number
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  fields: { type: Array, required: true },
  model: { type: Object, required: true }, // valeurs source
  errors: { type: Object, default: () => ({}) },
  submitting: { type: Boolean, default: false },
  submitLabel: { type: String, default: 'Enregistrer' },
  hint: { type: String, default: '' },
})

const emit = defineEmits(['save', 'close'])

const form = reactive({})

watch(
  () => props.open,
  (open) => {
    if (open) {
      Object.keys(form).forEach((key) => delete form[key])
      for (const field of props.fields) {
        const value = props.model[field.key]
        if (value === undefined || value === null) {
          form[field.key] =
            field.type === 'toggle' ? false : field.type === 'checkboxes' ? [] : ''
        } else {
          form[field.key] = value
        }
      }
    }
  },
  { immediate: true },
)

const anyError = computed(() => Object.keys(props.errors).length > 0)

function submit() {
  emit('save', { ...form })
}
</script>

<template>
  <AppModal :open="open" :title="title" size="lg" @close="emit('close')">
    <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
      <p v-if="hint" class="rounded-lg border border-line bg-ink-3 px-3 py-2 text-xs text-muted">
        {{ hint }}
      </p>

      <!-- Erreurs serveur transmises par la vue parente -->
      <slot />

      <div class="grid gap-5 sm:grid-cols-2">
        <template v-for="field in fields" :key="field.key">
          <!-- Champs pleine largeur -->
          <div
            v-if="field.type === 'textarea' || field.type === 'toggle' || field.type === 'checkboxes' || field.full"
            class="sm:col-span-2"
          >
            <AppTextarea
              v-if="field.type === 'textarea'"
              v-model="form[field.key]"
              :label="field.label"
              :name="field.key"
              :rows="field.rows || 4"
              :maxlength="field.maxlength"
              :placeholder="field.placeholder"
              :required="field.required"
              :error="errors[field.key]"
              :hint="field.hint"
            />

            <!-- Liste à cocher (technologies, sélections…) -->
            <fieldset v-else-if="field.type === 'checkboxes'">
              <legend class="mb-1.5 text-sm font-medium text-paper">
                {{ field.label }}
                <span v-if="field.required" class="text-gold" aria-hidden="true">*</span>
              </legend>
              <div
                class="grid max-h-52 gap-1.5 overflow-y-auto rounded-lg border border-line bg-ink-3 p-3 sm:grid-cols-2"
                :aria-describedby="errors[field.key] ? `err-${field.key}` : undefined"
              >
                <label
                  v-for="opt in field.options || []"
                  :key="String(opt.value)"
                  class="flex cursor-pointer items-center gap-2.5 rounded px-1 py-0.5 text-sm text-paper hover:text-gold"
                >
                  <input
                    v-model="form[field.key]"
                    type="checkbox"
                    :value="opt.value"
                    class="size-4 shrink-0 accent-gold"
                  />
                  <span class="truncate">{{ opt.label }}</span>
                </label>
                <p v-if="!(field.options || []).length" class="text-xs text-muted">
                  Aucune option disponible.
                </p>
              </div>
              <p v-if="errors[field.key]" :id="`err-${field.key}`" class="mt-1 text-sm text-danger" role="alert">
                {{ errors[field.key] }}
              </p>
              <p v-else-if="field.hint" class="mt-1 text-sm text-muted">{{ field.hint }}</p>
            </fieldset>

            <ToggleSwitch
              v-else
              v-model="form[field.key]"
              :label="field.label"
              :hint="field.hint"
            />
          </div>

          <AppSelect
            v-else-if="field.type === 'select'"
            v-model="form[field.key]"
            :label="field.label"
            :name="field.key"
            :options="field.options || []"
            :placeholder="field.placeholder || '— Choisir —'"
            :required="field.required"
            :error="errors[field.key]"
            :hint="field.hint"
          />

          <AppInput
            v-else
            v-model="form[field.key]"
            :label="field.label"
            :name="field.key"
            :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type || 'text'"
            :placeholder="field.placeholder"
            :required="field.required"
            :error="errors[field.key]"
            :hint="field.hint"
            :max="field.maxlength"
          />
        </template>
      </div>

      <p v-if="anyError" class="text-sm text-danger" role="alert">
        Corrigez les champs signalés ci-dessus.
      </p>

      <div class="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
        <AppButton variant="ghost" type="button" @click="emit('close')">
          Annuler
        </AppButton>
        <AppButton type="submit" :loading="submitting">
          {{ submitLabel }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
