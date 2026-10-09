<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Pencil, Trash2, FileDown, ExternalLink } from '@lucide/vue'
import { cvService } from '@/services/cv.service'
import { useCrud } from '@/composables/useCrud'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { api } from '@/services/api.js'
import { cvPdfFilename } from '@/utils/cv-data'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const toast = useToastStore()
const confirmStore = useConfirmStore()
const crud = useCrud(cvService.admin)
const downloadingId = ref(null)

const items = computed(() => crud.items.value)

onMounted(() => {
  crud.load({ per_page: 100 }).catch(() => {})
})

function edit(item) {
  router.push({ name: 'admin-cv-editor', params: { id: item.id } })
}

async function create() {
  try {
    const created = await cvService.admin.create({ name: 'Nouveau CV', template: 'default', language: 'fr' })
    toast.success('CV crÃ©Ã©. Configurez-le maintenant.')
    router.push({ name: 'admin-cv-editor', params: { id: created.id } })
  } catch (error) {
    toast.error(error?.message || 'ï¿½?chec de la crÃ©ation du CV.')
  }
}

async function download(item) {
  downloadingId.value = item.id
  try {
    const { blob, filename } = await cvService.downloadAdminPdf(item.id)
    api.saveBlob(blob, filename || cvPdfFilename(item.slug))
    toast.success('PDF tÃ©lÃ©chargÃ©.')
  } catch (error) {
    toast.error(error?.message || 'ï¿½?chec de la gÃ©nÃ©ration du PDF.')
  } finally {
    downloadingId.value = null
  }
}

async function remove(item) {
  const ok = await confirmStore.confirm({
    title: 'Supprimer le CV',
    message: `Supprimer Â« ${item.name} Â» ? Cette action est dÃ©finitive.`,
    confirmLabel: 'Supprimer',
  })
  if (!ok) return
  try {
    await cvService.admin.remove(item.id)
    toast.success('CV supprimÃ©.')
    crud.load({ per_page: 100 }).catch(() => {})
  } catch (error) {
    toast.error(error?.message || 'ï¿½?chec de la suppression.')
  }
}

function publicUrl(slug) {
  return `/cv/${slug}`
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <p class="max-w-2xl text-sm text-muted">
        Composez plusieurs versions de votre CV à partir des mêmes données professionnelles.
        Le PDF est généré par le backend (template « default »).
      </p>
      <AppButton @click="create">
        <Plus class="size-4" aria-hidden="true" />
        Créer un CV
      </AppButton>
    </div>

    <LoadingState v-if="crud.loading.value" label="Chargement des CV…" />
    <ErrorState v-else-if="crud.error.value" :error="crud.error.value" @retry="crud.load({ per_page: 100 })" />

    <template v-else-if="items.length">
      <ul class="flex flex-col gap-3 lg:hidden">
        <li
          v-for="item in items"
          :key="item.id"
          class="flex flex-col gap-3 rounded-xl border border-line bg-ink-2 p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-medium text-paper">{{ item.name }}</p>
              <p class="text-xs text-muted">/{{ item.slug }} · {{ item.language }}</p>
            </div>
            <AppBadge v-if="item.is_default" tone="gold">Par défaut</AppBadge>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <AppBadge :tone="item.is_public ? 'success' : 'neutral'">
              {{ item.is_public ? 'Public' : 'Privé' }}
            </AppBadge>
            <span class="text-xs text-muted">{{ item.template }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <AppButton size="sm" @click="edit(item)">
              <Pencil class="size-4" aria-hidden="true" />Modifier
            </AppButton>
            <AppButton size="sm" variant="secondary" :loading="downloadingId === item.id" @click="download(item)">
              <FileDown class="size-4" aria-hidden="true" />PDF
            </AppButton>
            <AppButton
              v-if="item.is_public"
              size="sm"
              variant="ghost"
              :to="publicUrl(item.slug)"
              :aria-label="`Ouvrir la version publique de ${item.name}`"
            >
              <ExternalLink class="size-4" aria-hidden="true" />Voir
            </AppButton>
            <AppButton size="sm" variant="danger" :aria-label="`Supprimer ${item.name}`" @click="remove(item)">
              <Trash2 class="size-4" aria-hidden="true" />
            </AppButton>
          </div>
        </li>
      </ul>

      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr class="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <th class="px-4 py-3 font-medium">Nom</th>
              <th class="px-4 py-3 font-medium">Langue</th>
              <th class="px-4 py-3 font-medium">Modèle</th>
              <th class="px-4 py-3 font-medium">Statut</th>
              <th class="px-4 py-3 font-medium">Défaut</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" class="border-b border-line">
              <td class="px-4 py-3">
                <p class="font-medium text-paper">{{ item.name }}</p>
                <p class="text-xs text-muted">/{{ item.slug }}</p>
              </td>
              <td class="px-4 py-3 text-muted">{{ item.language }}</td>
              <td class="px-4 py-3 text-muted">{{ item.template }}</td>
              <td class="px-4 py-3">
                <AppBadge :tone="item.is_public ? 'success' : 'neutral'">
                  {{ item.is_public ? 'Public' : 'Privé' }}
                </AppBadge>
              </td>
              <td class="px-4 py-3">
                <AppBadge v-if="item.is_default" tone="gold">Par défaut</AppBadge>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <AppButton size="sm" @click="edit(item)">
                    <Pencil class="size-4" aria-hidden="true" />Modifier
                  </AppButton>
                  <AppButton size="sm" variant="secondary" :loading="downloadingId === item.id" @click="download(item)">
                    <FileDown class="size-4" aria-hidden="true" />PDF
                  </AppButton>
                  <AppButton v-if="item.is_public" size="sm" variant="ghost" :to="publicUrl(item.slug)">
                    <ExternalLink class="size-4" aria-hidden="true" />Voir
                  </AppButton>
                  <AppButton size="sm" variant="danger" :aria-label="`Supprimer ${item.name}`" @click="remove(item)">
                    <Trash2 class="size-4" aria-hidden="true" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <EmptyState
      v-else
      title="Aucune version de CV"
      message="Créez une première version pour composer votre CV à partir de vos données professionnelles."
    >
      <AppButton @click="create">
        <Plus class="size-4" aria-hidden="true" />
        Créer un CV
      </AppButton>
    </EmptyState>
  </div>
</template>

