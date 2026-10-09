<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { FileText, ArrowRight, Star } from '@lucide/vue'
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'
import { cvService } from '@/services/cv.service'
import SectionHeading from '@/components/portfolio/SectionHeading.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

usePageMeta('CV', 'Versions publiques du CV.')

const cvs = useAsync(() => cvService.listPublic(), { initial: [] })
onMounted(() => {})

const LANG_LABELS = { fr: 'Français', en: 'Anglais' }

function langLabel(code) {
  return LANG_LABELS[code] || code
}
</script>

<template>
  <div class="container-page py-14 md:py-20">
    <SectionHeading
      eyebrow="Curriculum vitæ"
      title="Versions du CV"
      description="Chaque version est construite à partir des mêmes données professionnelles. Consultez-la en ligne ou téléchargez le PDF."
    />

    <LoadingState v-if="cvs.loading.value" />
    <ErrorState
      v-else-if="cvs.error.value"
      :error="cvs.error.value"
      @retry="cvs.reload"
    />

    <div
      v-else-if="cvs.data.value?.length"
      class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      <article
        v-for="cv in cvs.data.value"
        :key="cv.id"
        class="panel flex flex-col gap-4 p-6 transition-colors duration-300 hover:border-gold/40"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="flex size-11 items-center justify-center rounded-lg border border-line-2 text-gold">
            <FileText class="size-5" aria-hidden="true" />
          </span>
          <AppBadge v-if="cv.is_default" tone="gold">
            <Star class="size-3" aria-hidden="true" />
            Par défaut
          </AppBadge>
        </div>

        <div>
          <h2 class="text-lg font-semibold text-paper">{{ cv.name }}</h2>
          <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{{ langLabel(cv.language) }}</span>
            <span v-if="cv.template" class="text-line-2" aria-hidden="true">|</span>
            <span v-if="cv.template" class="font-mono text-xs">modèle {{ cv.template }}</span>
          </p>
        </div>

        <RouterLink
          :to="`/cv/${cv.slug}`"
          class="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:opacity-80"
        >
          Consulter cette version
          <ArrowRight class="size-4" aria-hidden="true" />
        </RouterLink>
      </article>
    </div>

    <EmptyState
      v-else
      title="Aucune version publique"
      message="Aucun CV n'est publié actuellement. Revenez prochainement."
    />
  </div>
</template>
