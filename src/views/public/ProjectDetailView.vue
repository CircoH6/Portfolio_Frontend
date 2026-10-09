<script setup>
import { computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ArrowLeft, ExternalLink, Calendar } from '@lucide/vue'
import IconGithub from '@/components/common/IconGithub.vue'
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'
import { projectsService } from '@/services/projects.service'
import { formatDate } from '@/utils/dates'
import { PROJECT_STATUS_LABELS, projectStatusTone } from '@/utils/project-status'
import AppBadge from '@/components/common/AppBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

const route = useRoute()

const project = useAsync(
  () => projectsService.getBySlug(String(route.params.slug)),
  { initial: null },
)

watch(
  () => route.params.slug,
  () => project.run(),
)

const title = computed(() => project.data.value?.title || 'Projet')
usePageMeta(title)

const statusLabel = computed(() =>
  PROJECT_STATUS_LABELS[project.data.value?.status] || null,
)

const dateRange = computed(() => {
  const p = project.data.value
  if (!p?.start_date && !p?.end_date) return null
  const start = p.start_date ? formatDate(p.start_date) : ''
  const end = p.end_date ? formatDate(p.end_date) : ''
  if (start && end) return `${start} — ${end}`
  return start || end
})

function section(value) {
  return Boolean(value && String(value).trim())
}
</script>

<template>
  <div class="container-page py-14 md:py-20">
    <RouterLink
      to="/projets"
      class="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-gold"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Retour aux projets
    </RouterLink>

    <LoadingState v-if="project.loading.value" />
    <ErrorState
      v-else-if="project.error.value"
      :error="project.error.value"
      :title="project.error.value.status === 404 ? 'Projet introuvable' : ''"
      @retry="project.reload"
    >
      <RouterLink to="/projets" class="text-sm text-gold hover:underline">
        Voir tous les projets
      </RouterLink>
    </ErrorState>

    <article v-else-if="project.data.value" class="flex flex-col gap-10">
      <header class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <AppBadge v-if="project.data.is_featured" tone="gold">★ En vedette</AppBadge>
          <AppBadge v-if="statusLabel" :tone="projectStatusTone(project.data.status)">
            {{ statusLabel }}
          </AppBadge>
        </div>

        <h1 class="text-3xl font-semibold text-paper md:text-4xl">
          {{ project.data.title }}
        </h1>

        <p
          v-if="project.data.short_description"
          class="max-w-3xl text-base leading-relaxed text-muted md:text-lg"
        >
          {{ project.data.short_description }}
        </p>

        <p v-if="dateRange" class="flex items-center gap-2 text-sm text-gold-deep">
          <Calendar class="size-4" aria-hidden="true" />
          {{ dateRange }}
        </p>
      </header>

      <!-- Galerie : uniquement les images réelles fournies par l'API -->
      <div
        v-if="project.data.images?.length"
        class="grid gap-4"
        :class="project.data.images.length > 1 ? 'sm:grid-cols-2' : ''"
      >
        <figure
          v-for="(image, index) in project.data.images"
          :key="image.id"
          class="panel overflow-hidden"
        >
          <img
            :src="image.path"
            :alt="image.alt || `${project.data.title} — capture ${index + 1}`"
            class="w-full object-cover"
            loading="lazy"
          />
          <figcaption v-if="image.caption" class="px-4 py-2 text-xs text-muted">
            {{ image.caption }}
          </figcaption>
        </figure>
      </div>

      <!-- Corps -->
      <div class="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div class="flex flex-col gap-8">
          <section v-if="section(project.data.description)" aria-labelledby="sec-desc">
            <h2 id="sec-desc" class="mb-3 text-xl font-semibold text-paper">
              Présentation
            </h2>
            <p class="whitespace-pre-line leading-relaxed text-muted">
              {{ project.data.description }}
            </p>
          </section>

          <section v-if="section(project.data.problem)" aria-labelledby="sec-problem">
            <h2 id="sec-problem" class="mb-3 text-xl font-semibold text-paper">
              Le problème traité
            </h2>
            <p class="whitespace-pre-line leading-relaxed text-muted">
              {{ project.data.problem }}
            </p>
          </section>

          <section v-if="section(project.data.solution)" aria-labelledby="sec-solution">
            <h2 id="sec-solution" class="mb-3 text-xl font-semibold text-paper">
              La solution apportée
            </h2>
            <p class="whitespace-pre-line leading-relaxed text-muted">
              {{ project.data.solution }}
            </p>
          </section>

          <section v-if="section(project.data.features)" aria-labelledby="sec-features">
            <h2 id="sec-features" class="mb-3 text-xl font-semibold text-paper">
              Fonctionnalités
            </h2>
            <p class="whitespace-pre-line leading-relaxed text-muted">
              {{ project.data.features }}
            </p>
          </section>
        </div>

        <aside class="flex flex-col gap-6">
          <div v-if="project.data.role" class="panel p-5">
            <h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-gold-deep">
              Rôle
            </h2>
            <p class="text-sm text-paper">{{ project.data.role }}</p>
          </div>

          <div v-if="project.data.technologies?.length" class="panel p-5">
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gold-deep">
              Technologies
            </h2>
            <ul class="flex flex-wrap gap-1.5">
              <li
                v-for="tech in project.data.technologies"
                :key="tech.id || tech.slug || tech.name"
                class="rounded-md border border-line bg-ink-3 px-2.5 py-1 font-mono text-xs text-muted"
              >
                {{ tech.name }}
              </li>
            </ul>
          </div>

          <div
            v-if="project.data.github_url || project.data.demo_url"
            class="panel flex flex-col gap-3 p-5"
          >
            <h2 class="text-sm font-semibold uppercase tracking-wider text-gold-deep">
              Liens
            </h2>
            <a
              v-if="project.data.github_url"
              :href="project.data.github_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-sm text-paper transition-colors hover:text-gold"
            >
              <IconGithub class="size-4" aria-hidden="true" />
              Code source
              <span class="sr-only">(nouvel onglet)</span>
            </a>
            <a
              v-if="project.data.demo_url"
              :href="project.data.demo_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 text-sm text-paper transition-colors hover:text-gold"
            >
              <ExternalLink class="size-4" aria-hidden="true" />
              Démonstration
              <span class="sr-only">(nouvel onglet)</span>
            </a>
          </div>
        </aside>
      </div>
    </article>
  </div>
</template>

