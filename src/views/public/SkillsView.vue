<script setup>
import { computed, onMounted } from 'vue'
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'
import { skillsService } from '@/services/skills.service'
import SectionHeading from '@/components/portfolio/SectionHeading.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

usePageMeta('Compétences', 'Compétences techniques regroupées par catégorie.')

const skills = useAsync(() => skillsService.listPublic(), { initial: [] })
onMounted(() => {})

/** Groupement par catégorie — sans pourcentages ni niveaux fictifs. */
const groups = computed(() => {
  const map = new Map()
  for (const skill of skills.data.value || []) {
    const key = skill.category?.name || 'Autres'
    if (!map.has(key)) {
      map.set(key, {
        id: skill.category?.id ?? 'other',
        name: key,
        description: skill.category?.description || '',
        items: [],
      })
    }
    map.get(key).items.push(skill)
  }
  return [...map.values()]
})
</script>

<template>
  <div class="container-page py-14 md:py-20">
    <SectionHeading
      eyebrow="Savoir-faire"
      title="Compétences techniques"
      description="Regroupées par catégorie, telles que déclarées dans l'administration."
    />

    <LoadingState v-if="skills.loading.value" />
    <ErrorState
      v-else-if="skills.error.value"
      :error="skills.error.value"
      @retry="skills.reload"
    />

    <div v-else-if="groups.length" class="flex flex-col gap-8">
      <section
        v-for="group in groups"
        :key="group.id"
        class="panel p-6 md:p-8"
        :aria-labelledby="`cat-${group.id}`"
      >
        <header class="mb-5 flex flex-col gap-1">
          <h2 :id="`cat-${group.id}`" class="text-xl font-semibold text-paper">
            {{ group.name }}
          </h2>
          <p v-if="group.description" class="text-sm text-muted">
            {{ group.description }}
          </p>
        </header>

        <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="skill in group.items"
            :key="skill.id"
            class="flex items-center gap-3 rounded-lg border border-line bg-ink-3 px-4 py-3 transition-colors duration-200 hover:border-gold/40"
          >
            <img
              v-if="skill.icon && /^(https?:|\/|data:)/.test(skill.icon)"
              :src="skill.icon"
              :alt="`Icône ${skill.name}`"
              class="size-5 shrink-0 object-contain"
              loading="lazy"
            />
            <span class="flex min-w-0 flex-col">
              <span class="truncate text-sm font-medium text-paper">{{ skill.name }}</span>
              <span v-if="skill.description" class="truncate text-xs text-muted">
                {{ skill.description }}
              </span>
            </span>
          </li>
        </ul>
      </section>
    </div>

    <p v-else class="text-sm text-muted">
      Aucune compétence publique disponible pour le moment.
    </p>
  </div>
</template>
