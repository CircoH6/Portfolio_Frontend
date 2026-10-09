<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeft, Download, Printer, ExternalLink } from '@lucide/vue'
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'
import { useToastStore } from '@/stores/toast.store'
import { cvService } from '@/services/cv.service'
import { api } from '@/services/api.js'
import { normalizeCv, cvPdfFilename } from '@/utils/cv-data'
import CvSheet from '@/components/cv/CvSheet.vue'
import AppButton from '@/components/common/AppButton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

const route = useRoute()
const toast = useToastStore()

const cv = useAsync(
  () => cvService.getBySlug(String(route.params.slug)),
  { initial: null },
)
watch(
  () => route.params.slug,
  () => cv.run(),
)

const sheet = computed(() => normalizeCv(cv.data.value))
const title = computed(() => sheet.value?.cv?.name || 'CV')
usePageMeta(title)

const downloading = ref(false)

async function downloadPdf() {
  downloading.value = true
  try {
    const slug = String(route.params.slug)
    const { blob, filename } = await cvService.downloadPublicPdf(slug)
    // Nom backend (Content-Disposition) avec repli sur la règle du backend.
    const name = filename || cvPdfFilename(sheet.value?.cv?.slug || slug)
    if (blob && blob.size > 0) {
      api.saveBlob(blob, name)
    } else {
      toast.error('Le fichier PDF reçu est vide.')
    }
  } catch (error) {
    toast.error(error?.message || 'Échec du téléchargement du PDF.')
  } finally {
    downloading.value = false
  }
}

function printSheet() {
  window.print()
}
</script>

<template>
  <div class="container-page py-10 md:py-14">
    <!-- Barre d'actions (non imprimée) -->
    <div class="no-print mb-8 flex flex-col gap-4">
      <RouterLink
        to="/cv"
        class="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-gold"
      >
        <ArrowLeft class="size-4" aria-hidden="true" />
        Toutes les versions
      </RouterLink>

      <div
        v-if="sheet"
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 class="text-2xl font-semibold text-paper md:text-3xl">
            {{ sheet.cv.name }}
          </h1>
          <p v-if="sheet.profile.professional_title" class="mt-1 text-sm text-gold">
            {{ sheet.profile.professional_title }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <AppButton :loading="downloading" @click="downloadPdf">
            <Download class="size-4" aria-hidden="true" />
            Télécharger le PDF
          </AppButton>
          <AppButton variant="secondary" @click="printSheet">
            <Printer class="size-4" aria-hidden="true" />
            Imprimer
          </AppButton>
          <AppButton
            v-if="sheet.profile.website"
            variant="ghost"
            :href="sheet.profile.website"
          >
            <ExternalLink class="size-4" aria-hidden="true" />
            Site
          </AppButton>
        </div>
      </div>
    </div>

    <LoadingState v-if="cv.loading.value" label="Chargement du CV…" />
    <ErrorState
      v-else-if="cv.error.value"
      :error="cv.error.value"
      :title="cv.error.value.status === 404 ? 'CV introuvable ou non publié' : ''"
      @retry="cv.reload"
    >
      <RouterLink to="/cv" class="text-sm text-gold hover:underline">
        Voir les CV disponibles
      </RouterLink>
    </ErrorState>

    <div v-else-if="sheet" class="overflow-x-auto pb-6">
      <CvSheet :data="sheet" class="mx-auto" />
    </div>
  </div>
</template>
