<script setup>
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'
import { experiencesService } from '@/services/experiences.service'
import { educationsService } from '@/services/educations.service'
import { certificationsService } from '@/services/certifications.service'
import { formatDate, formatMonthYear } from '@/utils/dates'
import SectionHeading from '@/components/portfolio/SectionHeading.vue'
import TimelineList from '@/components/portfolio/TimelineList.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

usePageMeta('Parcours', 'Expériences professionnelles, formations, certifications et langues.')

const experiences = useAsync(() => experiencesService.listPublic(), { initial: [] })
const educations = useAsync(() => educationsService.listPublic(), { initial: [] })
const certifications = useAsync(() => certificationsService.listPublic(), { initial: [] })

function certDate(cert) {
  const issued = cert.issue_date ? formatMonthYear(cert.issue_date) : ''
  const expires = cert.expiration_date ? `→ ${formatMonthYear(cert.expiration_date)}` : ''
  return [issued, expires].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="container-page py-14 md:py-20">
    <SectionHeading
      eyebrow="Parcours"
      title="Expériences et formations"
      description="Chronologie construite à partir des données publiées — dates et statuts issus de l'API."
    />

    <!-- Expériences -->
    <section class="mb-14" aria-labelledby="exp-heading">
      <h2 id="exp-heading" class="mb-6 text-xl font-semibold text-gold md:text-2xl">
        Expérience professionnelle
      </h2>
      <LoadingState v-if="experiences.loading.value" compact />
      <ErrorState
        v-else-if="experiences.error.value"
        :error="experiences.error.value"
        @retry="experiences.reload"
      />
      <TimelineList
        v-else-if="experiences.data.value?.length"
        :items="experiences.data.value"
        mode="experience"
      />
      <p v-else class="text-sm text-muted">Aucune expérience publiée pour le moment.</p>
    </section>

    <!-- Formations -->
    <section class="mb-14" aria-labelledby="edu-heading">
      <h2 id="edu-heading" class="mb-6 text-xl font-semibold text-gold md:text-2xl">
        Formation
      </h2>
      <LoadingState v-if="educations.loading.value" compact />
      <ErrorState
        v-else-if="educations.error.value"
        :error="educations.error.value"
        @retry="educations.reload"
      />
      <TimelineList
        v-else-if="educations.data.value?.length"
        :items="educations.data.value"
        mode="education"
      />
      <p v-else class="text-sm text-muted">Aucune formation publiée pour le moment.</p>
    </section>

    <!-- Certifications -->
    <section v-if="certifications.data.value?.length || certifications.loading.value" aria-labelledby="cert-heading">
      <h2 id="cert-heading" class="mb-6 text-xl font-semibold text-gold md:text-2xl">
        Certifications
      </h2>
      <LoadingState v-if="certifications.loading.value" compact />
      <ErrorState
        v-else-if="certifications.error.value"
        :error="certifications.error.value"
        @retry="certifications.reload"
      />
      <ul v-else class="grid gap-4 sm:grid-cols-2">
        <li v-for="cert in certifications.data.value" :key="cert.id" class="panel p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold text-paper">{{ cert.name }}</h3>
              <p class="mt-0.5 text-sm text-muted">{{ cert.organization }}</p>
            </div>
            <AppBadge v-if="certDate(cert)" tone="gold">{{ certDate(cert) }}</AppBadge>
          </div>
          <p v-if="cert.description" class="mt-3 text-sm leading-relaxed text-muted">
            {{ cert.description }}
          </p>
          <a
            v-if="cert.credential_url"
            :href="cert.credential_url"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-block break-all text-sm text-gold hover:underline"
          >
            Vérifier le credential
            <span class="sr-only">(nouvel onglet)</span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>
