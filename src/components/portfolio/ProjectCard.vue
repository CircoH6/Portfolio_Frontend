<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight } from '@lucide/vue'
import IconGithub from '@/components/common/IconGithub.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import { PROJECT_STATUS_LABELS, projectStatusTone } from '@/utils/project-status'

/** Carte projet — image principale, titre, description, technologies, statut. */
const props = defineProps({
  project: { type: Object, required: true },
  featured: { type: Boolean, default: false },
})

const cover = computed(() => props.project.images?.[0]?.path || null)
const statusLabel = computed(() => PROJECT_STATUS_LABELS[props.project.status] || null)
</script>

<template>
  <article
    class="panel group flex h-full flex-col overflow-hidden transition-colors duration-300 hover:border-gold/40"
  >
    <!-- Visuel (seulement si fourni par l'API) -->
    <RouterLink
      :to="`/projets/${project.slug}`"
      class="block aspect-video overflow-hidden border-b border-line bg-ink-3"
      :aria-label="`Voir le projet ${project.title}`"
      tabindex="-1"
    >
      <img
        v-if="cover"
        :src="cover"
        :alt="project.images?.[0]?.alt || project.title"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        loading="lazy"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-muted/50"
        aria-hidden="true"
      >
        Aperçu
      </div>
    </RouterLink>

    <div class="flex flex-1 flex-col gap-3 p-5">
      <div class="flex flex-wrap items-center gap-2">
        <AppBadge v-if="featured" tone="gold">★ En vedette</AppBadge>
        <AppBadge v-if="statusLabel" :tone="projectStatusTone(project.status)">
          {{ statusLabel }}
        </AppBadge>
      </div>

      <h3 class="text-lg font-semibold text-paper">
        <RouterLink :to="`/projets/${project.slug}`" class="transition-colors hover:text-gold">
          {{ project.title }}
        </RouterLink>
      </h3>

      <p class="flex-1 text-sm leading-relaxed text-muted">
        {{ project.short_description || 'Aucune description courte renseignée.' }}
      </p>

      <ul
        v-if="project.technologies?.length"
        class="flex flex-wrap gap-1.5"
        :aria-label="`Technologies du projet ${project.title}`"
      >
        <li
          v-for="tech in project.technologies"
          :key="tech.id || tech.slug || tech.name"
          class="rounded-md border border-line px-2 py-0.5 font-mono text-[11px] text-muted"
        >
          {{ tech.name }}
        </li>
      </ul>

      <div class="mt-1 flex items-center justify-between gap-3 border-t border-line pt-3">
        <RouterLink
          :to="`/projets/${project.slug}`"
          class="inline-flex items-center gap-1 text-sm font-medium text-gold transition-opacity hover:opacity-80"
        >
          Détails
          <ArrowUpRight class="size-4" aria-hidden="true" />
        </RouterLink>
        <a
          v-if="project.github_url"
          :href="project.github_url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-muted transition-colors hover:text-gold"
          :aria-label="`Code source du projet ${project.title} sur GitHub (nouvel onglet)`"
        >
          <IconGithub class="size-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  </article>
</template>
