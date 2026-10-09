<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Images } from '@lucide/vue'
import { useCrud } from '@/composables/useCrud'
import { projectsService } from '@/services/projects.service'
import { technologiesService } from '@/services/technologies.service'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { validate, backendErrorsToMap } from '@/utils/validators'
import { ApiError } from '@/services/api.js'
import { PROJECT_STATUS_OPTIONS, PROJECT_STATUS_LABELS, projectStatusTone } from '@/utils/project-status'
import CrudTable from '@/components/admin/CrudTable.vue'
import CrudFormModal from '@/components/admin/CrudFormModal.vue'
import ProjectImagesModal from '@/components/admin/ProjectImagesModal.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

const toast = useToastStore()
const confirmStore = useConfirmStore()
const crud = useCrud(projectsService.admin)

const technologies = ref([])
const page = ref(1)
const statusFilter = ref('')
const modalOpen = ref(false)
const editingId = ref(null)
const formErrors = reactive({})
const serverError = ref(null)
const imagesFor = ref(null)

const columns = [
  { key: 'title', label: 'Titre' },
  { key: 'status', label: 'Statut' },
  { key: 'technologies', label: 'Technologies' },
  { key: 'featured', label: 'En vedette', align: 'right' },
  { key: 'visible', label: 'Visible', align: 'right' },
]

const fields = reactive([
  { key: 'title', label: 'Titre', type: 'text', required: true, maxlength: 255 },
  { key: 'slug', label: 'Slug', type: 'text', maxlength: 255, hint: 'Vide pour generer le slug.' },
  { key: 'status', label: 'Statut', type: 'select', options: PROJECT_STATUS_OPTIONS },
  { key: 'short_description', label: 'Description courte', type: 'textarea', rows: 3, maxlength: 500 },
  { key: 'description', label: 'Description detaillee', type: 'textarea', rows: 5, maxlength: 30000 },
  { key: 'problem', label: 'Probleme traite', type: 'textarea', rows: 3, maxlength: 10000 },
  { key: 'solution', label: 'Solution apportee', type: 'textarea', rows: 3, maxlength: 10000 },
  { key: 'features', label: 'Fonctionnalites', type: 'textarea', rows: 3, maxlength: 20000 },
  { key: 'role', label: 'Role', type: 'text', maxlength: 255 },
  { key: 'start_date', label: 'Date de debut', type: 'date' },
  { key: 'end_date', label: 'Date de fin', type: 'date' },
  { key: 'github_url', label: 'URL GitHub', type: 'url', maxlength: 255, placeholder: 'https://exemple.fr' },
  { key: 'demo_url', label: 'URL de demo', type: 'url', maxlength: 255, placeholder: 'https://exemple.fr' },
  { key: 'display_order', label: "Ordre d'affichage", type: 'number', hint: 'Plus bas = premier.' },
  { key: 'is_featured', label: 'Mettre en avant', type: 'toggle' },
  { key: 'is_visible', label: 'Visible publiquement', type: 'toggle' },
  { key: 'technology_ids', label: 'Technologies', type: 'checkboxes', options: [] },
])

const rules = {
  title: [{ required: true }, { max: 255 }],
  slug: [{ max: 255 }],
  short_description: [{ max: 500 }],
  github_url: [{ url: true }, { max: 255 }],
  demo_url: [{ url: true }, { max: 255 }],
  role: [{ max: 255 }],
}

const pagination = computed(() => crud.pagination.value)


function load() {
  const params = { page: page.value, per_page: 15 }
  if (statusFilter.value) params.status = statusFilter.value
  return crud.load(params)
}

onMounted(async () => {
  try {
    technologies.value = await technologiesService.list()
    const techField = fields.find((f) => f.key === 'technology_ids')
    if (techField) techField.options = technologies.value.map((t) => ({ value: t.id, label: t.name }))
  } catch {
    technologies.value = []
  }
  load().catch(() => {})
})

function clearErrors() {
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
  serverError.value = null
}

function openCreate() {
  clearErrors()
  editingId.value = null
  modalOpen.value = true
}

function currentModel() {
  if (!editingId.value) return {}
  const item = crud.items.value.find((i) => i.id === editingId.value) || {}
  return { ...item, technology_ids: (item.technologies || []).map((t) => t.id) }
}

function openEdit(item) {
  clearErrors()
  editingId.value = item.id
  modalOpen.value = true
}

function buildPayload(values) {
  const payload = { ...values }
  delete payload.created_at
  delete payload.updated_at
  delete payload.technologies
  delete payload.images
  for (const [k, v] of Object.entries(payload)) {
    if (k === 'technology_ids') continue
    if (typeof v === 'string' && v.trim() === '') delete payload[k]
  }
  if (payload.display_order === '' || payload.display_order === null) {
    delete payload.display_order
  } else if (payload.display_order !== undefined) {
    payload.display_order = Number(payload.display_order)
  }
  return payload
}

async function onSave(values) {
  clearErrors()
  const localErrors = validate(values, rules)
  if (Object.keys(localErrors).length) {
    Object.assign(formErrors, localErrors)
    return
  }
  try {
    await crud.save(buildPayload(values), editingId.value)
    modalOpen.value = false
    toast.success(editingId.value ? 'Projet mis a jour.' : 'Projet cree.')
    await load()
  } catch (error) {
    if (error instanceof ApiError && error.isValidation && error.errors) {
      Object.assign(formErrors, backendErrorsToMap(error.errors))
    } else {
      serverError.value = error
      toast.error(error?.message || "Echec de l'enregistrement.")
    }
  }
}

async function onDelete(item) {
  const ok = await confirmStore.confirm({
    title: 'Supprimer le projet',
    message: `Supprimer « ${item.title} » et ses images ? Action définitive.`,
    confirmLabel: 'Supprimer',
  })
  if (!ok) return
  try {
    await crud.remove(item.id)
    toast.success('Projet supprime.')
    if (crud.items.value.length === 1 && page.value > 1) page.value -= 1
    await load()
  } catch (error) {
    toast.error(error?.message || 'Echec de la suppression.')
  }
}

function goToPage(next) {
  page.value = next
  load().catch(() => {})
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <p class="max-w-2xl text-sm text-muted">
        Projets affichés sur le site public et sélectionnables dans les CV.
      </p>
      <AppButton @click="openCreate">
        <Plus class="size-4" aria-hidden="true" />
        Ajouter un projet
      </AppButton>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <label for="status-filter" class="text-sm text-muted">Filtrer par statut</label>
      <select
        id="status-filter"
        v-model="statusFilter"
        class="rounded-lg border border-line bg-ink-3 px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
        @change="page = 1; load()"
      >
        <option value="">Tous les statuts</option>
        <option v-for="opt in PROJECT_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <LoadingState v-if="crud.loading.value" label="Chargement…" />
    <ErrorState v-else-if="crud.error.value" :error="crud.error.value" @retry="load()" />

    <template v-else>
      <CrudTable :items="crud.items.value" :columns="columns" empty-label="Aucun projet.">
        <template #cell-title="{ item }">
          <span class="font-medium text-paper">{{ item.title }}</span>
        </template>
        <template #cell-status="{ item }">
          <AppBadge :tone="projectStatusTone(item.status)">
            {{ PROJECT_STATUS_LABELS[item.status] || item.status }}
          </AppBadge>
        </template>
        <template #cell-technologies="{ item }">
          <span class="text-sm text-muted">
            {{ (item.technologies || []).map((t) => t.name).join(', ') || '—' }}
          </span>
        </template>
        <template #cell-featured="{ item }">
          <AppBadge v-if="item.is_featured" tone="gold">Oui</AppBadge>
          <span v-else class="text-sm text-muted">—</span>
        </template>
        <template #cell-visible="{ item }">
          <AppBadge v-if="item.is_visible" tone="success">Oui</AppBadge>
          <AppBadge v-else tone="neutral">Non</AppBadge>
        </template>
        <template #actions="{ item }">
          <button
            type="button"
            class="rounded-lg border border-line-2 p-2 text-muted transition-colors hover:border-gold hover:text-gold"
            :aria-label="`Gérer les images de ${item.title}`"
            @click="imagesFor = item"
          >
            <Images class="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="rounded-lg border border-line-2 p-2 text-muted transition-colors hover:border-gold hover:text-gold"
            :aria-label="`Modifier ${item.title}`"
            @click="openEdit(item)"
          >
            <Pencil class="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="rounded-lg border border-line-2 p-2 text-muted transition-colors hover:border-danger hover:text-danger"
            :aria-label="`Supprimer ${item.title}`"
            @click="onDelete(item)"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </button>
        </template>
      </CrudTable>

      <AppPagination
        v-if="pagination"
        :pagination="pagination"
        :disabled="crud.loading.value"
        @change="goToPage"
      />
    </template>

    <CrudFormModal
      :open="modalOpen"
      :title="editingId ? 'Modifier le projet' : 'Nouveau projet'"
      :fields="fields"
      :model="currentModel()"
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

    <AppModal
      :open="Boolean(imagesFor)"
      :title="`Images - ${imagesFor?.title || ''}`"
      size="xl"
      @close="imagesFor = null"
    >
      <ProjectImagesModal
        v-if="imagesFor"
        :key="imagesFor.id"
        :project="imagesFor"
        @changed="load()"
      />
    </AppModal>
  </div>
</template>
