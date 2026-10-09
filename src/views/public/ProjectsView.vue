<script setup>
import { ref, computed, watch } from 'vue'
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'
import { projectsService } from '@/services/projects.service'
import SectionHeading from '@/components/portfolio/SectionHeading.vue'
import ProjectCard from '@/components/portfolio/ProjectCard.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'
import AppButton from '@/components/common/AppButton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'

usePageMeta('Projets', 'Projets réalisés, technologies utilisées et état d’avancement.')

const PER_PAGE = 12

const all = useAsync(async () => {
  // Chargement exhaustif par pages de 50 (maximum de l'API) : indispensable
  // pour une recherche et des filtres corrects côté client.
  const first = await projectsService.listPublic({ per_page: 50, page: 1 })
  const items = [...(first.projects || [])]
  const total = first.pagination?.total ?? items.length
  let page = 1
  while (items.length < total && page < 10) {
    page += 1
    const next = await projectsService.listPublic({ per_page: 50, page })
    if (!next.projects?.length) break
    items.push(...next.projects)
  }
  return items
}, { initial: [] })

const search = ref('')
const technology = ref('')
const featuredOnly = ref(false)
const currentPage = ref(1)

const techOptions = computed(() => {
  const map = new Map()
  for (const project of all.data.value || []) {
    for (const tech of project.technologies || []) {
      if (tech.slug) map.set(tech.slug, tech.name)
    }
  }
  return [...map.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
})

const filtered = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return (all.data.value || []).filter((project) => {
    if (featuredOnly.value && !project.is_featured) return false
    if (technology.value) {
      const found = (project.technologies || []).some((t) => t.slug === technology.value)
      if (!found) return false
    }
    if (needle) {
      const haystack = [
        project.title,
        project.short_description,
        ...(project.technologies || []).map((t) => t.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)))
const visibleProjects = computed(() => {
  const start = (currentPage.value - 1) * PER_PAGE
  return filtered.value.slice(start, start + PER_PAGE)
})

const hasFilters = computed(() => Boolean(search.value || technology.value || featuredOnly.value))

watch([search, technology, featuredOnly], () => {
  currentPage.value = 1
})

function resetFilters() {
  search.value = ''
  technology.value = ''
  featuredOnly.value = false
}
</script>

<template>
  <div class="container-page py-14 md:py-20">
    <SectionHeading
      eyebrow="Réalisations"
      title="Projets"
      description="Chaque projet est présenté avec son statut réel d'avancement."
    />

    <LoadingState v-if="all.loading.value" />
    <ErrorState
      v-else-if="all.error.value"
      :error="all.error.value"
      @retry="all.reload"
    />

    <template v-else>
      <div class="panel mb-8 grid gap-4 p-4 md:grid-cols-[1fr_16rem_auto] md:items-end">
        <AppInput
          v-model="search"
          label="Rechercher"
          placeholder="Titre, description, technologie…"
          type="search"
          name="search"
        />
        <AppSelect
          v-model="technology"
          label="Technologie"
          :options="techOptions"
          placeholder="Toutes"
          name="technology"
        />
        <ToggleSwitch
          v-model="featuredOnly"
          label="En vedette uniquement"
          class="pb-1"
        />
      </div>

      <p class="mb-4 text-sm text-muted" role="status">
        {{ filtered.length }} projet{{ filtered.length > 1 ? 's' : '' }}
        <span v-if="hasFilters"> correspondant aux filtres</span>
      </p>

      <div v-if="visibleProjects.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCard
          v-for="project in visibleProjects"
          :key="project.id"
          :project="project"
          :featured="project.is_featured"
        />
      </div>

      <EmptyState
        v-else-if="hasFilters"
        title="Aucun projet ne correspond"
        message="Modifiez la recherche ou les filtres pour élargir les résultats."
      >
        <AppButton variant="secondary" @click="resetFilters">
          Réinitialiser les filtres
        </AppButton>
      </EmptyState>
      <EmptyState
        v-else
        title="Aucun projet publié"
        message="Les projets apparaîtront ici dès leur publication."
      />

      <nav
        v-if="totalPages > 1"
        class="mt-10 flex items-center justify-center gap-3"
        aria-label="Pagination des projets"
      >
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          Précédent
        </AppButton>
        <span class="text-sm text-muted">
          Page {{ currentPage }} sur {{ totalPages }}
        </span>
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          Suivant
        </AppButton>
      </nav>
    </template>
  </div>
</template>
