<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Pencil, Trash2 } from '@lucide/vue'
import { useCrud } from '@/composables/useCrud'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { validate, backendErrorsToMap } from '@/utils/validators'
import { ApiError } from '@/services/api.js'
import CrudTable from '@/components/admin/CrudTable.vue'
import CrudFormModal from '@/components/admin/CrudFormModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

/**
 * Page CRUD générique pour les apiResource Laravel.
 * - `service` : { list, create, update, remove } (services/crud.js)
 * - `columns` : [{ key, label, align?, class? }]
 * - `fields`  : configuration du formulaire (CrudFormModal)
 * - `rules`   : règles de validation locales par champ
 */
const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  service: { type: Object, required: true },
  columns: { type: Array, required: true },
  fields: { type: Array, required: true },
  rules: { type: Object, default: () => ({}) },
  emptyLabel: { type: String, default: 'Aucun élément pour le moment.' },
  createLabel: { type: String, default: 'Ajouter' },
  modalTitle: { type: String, default: '' },
})

const toast = useToastStore()
const confirmStore = useConfirmStore()
const crud = useCrud(props.service)

const modalOpen = ref(false)
const editingId = ref(null)
const formErrors = reactive({})
const serverError = ref(null)

const formFields = computed(() => props.fields)

onMounted(() => {
  crud.load().catch(() => {})
})

function clearErrors() {
  Object.keys(formErrors).forEach((key) => delete formErrors[key])
  serverError.value = null
}

function openCreate() {
  clearErrors()
  editingId.value = null
  modalOpen.value = true
}

function openEdit(item) {
  clearErrors()
  editingId.value = item.id
  modalOpen.value = true
}

async function onSave(values) {
  clearErrors()

  const localErrors = validate(values, props.rules)
  if (Object.keys(localErrors).length) {
    Object.assign(formErrors, localErrors)
    return
  }

  try {
    const payload = { ...values }
    delete payload.created_at
    delete payload.updated_at

    await crud.save(payload, editingId.value)
    modalOpen.value = false
    toast.success(editingId.value ? 'Modifications enregistrées.' : 'Élément créé.')
    await crud.load()
  } catch (error) {
    if (error instanceof ApiError && error.isValidation && error.errors) {
      Object.assign(formErrors, backendErrorsToMap(error.errors))
    } else {
      serverError.value = error
      toast.error(error?.message || "Échec de l'enregistrement.")
    }
  }
}

async function onDelete(item) {
  const label = item.title || item.name || item.degree || item.institution || `#${item.id}`
  const ok = await confirmStore.confirm({
    title: 'Supprimer',
    message: `Supprimer « ${label} » ? Cette action est définitive.`,
    confirmLabel: 'Supprimer',
  })
  if (!ok) return

  try {
    await crud.remove(item.id)
    toast.success('Élément supprimé.')
    await crud.load()
  } catch (error) {
    toast.error(error?.message || 'Échec de la suppression.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <p v-if="description" class="max-w-2xl text-sm text-muted">{{ description }}</p>
      <AppButton @click="openCreate">
        <Plus class="size-4" aria-hidden="true" />
        {{ createLabel }}
      </AppButton>
    </div>

    <LoadingState v-if="crud.loading.value" label="Chargement…" />
    <ErrorState
      v-else-if="crud.error.value"
      :error="crud.error.value"
      @retry="crud.load().catch(() => {})"
    />

    <template v-else>
      <CrudTable
        :items="crud.items.value"
        :columns="columns"
        :empty-label="emptyLabel"
      >
        <!-- Transpare des slots `cell-<key>` fournis par la vue parente -->
        <template
          v-for="slotName in Object.keys($slots)"
          :key="slotName"
          #[slotName]="scope"
        >
          <slot :name="slotName" v-bind="scope" />
        </template>

        <template #actions="{ item }">
          <button
            type="button"
            class="rounded-lg border border-line-2 p-2 text-muted transition-colors hover:border-gold hover:text-gold"
            :aria-label="`Modifier ${item.title || item.name || 'cet élément'}`"
            @click="openEdit(item)"
          >
            <Pencil class="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="rounded-lg border border-line-2 p-2 text-muted transition-colors hover:border-danger hover:text-danger"
            :aria-label="`Supprimer ${item.title || item.name || 'cet élément'}`"
            @click="onDelete(item)"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </button>
        </template>
      </CrudTable>
    </template>

    <CrudFormModal
      :open="modalOpen"
      :title="modalTitle || (editingId ? `Modifier — ${title}` : `Ajouter — ${title}`)"
      :fields="formFields"
      :model="crud.items.value.find((i) => i.id === editingId) || {}"
      :errors="formErrors"
      :submitting="crud.saving.value"
      @save="onSave"
      @close="modalOpen = false"
    >
      <div
        v-if="serverError"
        class="mb-4 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
        role="alert"
      >
        {{ serverError.message }}
      </div>
    </CrudFormModal>
  </div>
</template>

