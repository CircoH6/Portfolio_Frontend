<script setup>
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { MapPin, Globe, ArrowRight } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile.store'
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'
import { skillsService } from '@/services/skills.service'
import { languagesService } from '@/services/languages.service'
import SectionHeading from '@/components/portfolio/SectionHeading.vue'
import ContactMethods from '@/components/portfolio/ContactMethods.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

usePageMeta('À propos', 'Biographie, positionnement professionnel et informations de profil.')

const profileStore = useProfileStore()
const { publicProfile: profile, publicStatus, publicError } = storeToRefs(profileStore)

onMounted(() => profileStore.fetchPublic().catch(() => {}))

const skills = useAsync(() => skillsService.listPublic(), { initial: [] })
const languages = useAsync(() => languagesService.listPublic(), { initial: [] })

const categories = computed(() => {
  const map = new Map()
  for (const skill of skills.data.value || []) {
    const key = skill.category?.name || 'Autres'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(skill)
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }))
})
</script>

<template>
  <div class="container-page py-14 md:py-20">
    <SectionHeading
      eyebrow="À propos"
      title="Qui suis-je ?"
      description="Biographie et informations issues du profil — aucune donnée inventée."
    />

    <LoadingState v-if="publicStatus === 'loading'" />
    <ErrorState
      v-else-if="publicStatus === 'error'"
      :error="publicError"
      @retry="profileStore.fetchPublic(true).catch(() => {})"
    />

    <template v-else-if="profile">
      <div class="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <article class="panel p-6 md:p-8">
          <div class="mb-6 flex items-center gap-5">
            <img
              v-if="profile.profile_image"
              :src="profile.profile_image"
              :alt="`Photo de ${profile.full_name}`"
              class="size-20 rounded-full border border-gold/40 object-cover"
            />
            <div>
              <h2 class="text-2xl font-semibold text-paper">
                {{ profile.full_name || 'Profil en cours de configuration' }}
              </h2>
              <p v-if="profile.professional_title" class="mt-1 text-gold">
                {{ profile.professional_title }}
              </p>
            </div>
          </div>

          <p class="whitespace-pre-line leading-relaxed text-muted">
            {{ profile.long_bio || profile.short_bio || 'Aucune biographie renseignée.' }}
          </p>

          <ul class="mt-6 flex flex-wrap gap-4 border-t border-line pt-6 text-sm text-muted">
            <li v-if="profile.location" class="flex items-center gap-1.5">
              <MapPin class="size-4 text-gold-deep" aria-hidden="true" />
              {{ profile.location }}
            </li>
            <li v-if="profile.website">
              <a
                :href="profile.website"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 hover:text-gold"
              >
                <Globe class="size-4 text-gold-deep" aria-hidden="true" />
                {{ profile.website.replace(/^https?:\/\//, '') }}
              </a>
            </li>
          </ul>
        </article>

        <aside class="flex flex-col gap-6">
          <div class="panel p-6">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-deep">
              Me joindre
            </h2>
            <ContactMethods :methods="profile.contact_methods || []" />
          </div>

          <div v-if="languages.data.value?.length" class="panel p-6">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-deep">
              Langues
            </h2>
            <ul class="flex flex-col gap-2.5">
              <li
                v-for="lang in languages.data.value"
                :key="lang.id"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <span class="text-paper">{{ lang.name }}</span>
                <AppBadge v-if="lang.level" tone="gold">{{ lang.level }}</AppBadge>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <!-- Compétences par catégorie (aperçu) -->
      <section class="mt-14" aria-labelledby="skills-preview">
        <SectionHeading
          id="skills-preview"
          eyebrow="Expertise"
          title="Domaines de compétences"
        />
        <LoadingState v-if="skills.loading.value" compact />
        <ErrorState
          v-else-if="skills.error.value"
          :error="skills.error.value"
          @retry="skills.reload"
        />
        <div v-else-if="categories.length" class="grid gap-5 sm:grid-cols-2">
          <div v-for="group in categories" :key="group.name" class="panel p-5">
            <h3 class="mb-3 font-semibold text-gold">{{ group.name }}</h3>
            <ul class="flex flex-wrap gap-1.5">
              <li
                v-for="skill in group.items"
                :key="skill.id"
                class="rounded-md border border-line px-2.5 py-1 text-xs text-muted"
              >
                {{ skill.name }}
              </li>
            </ul>
          </div>
        </div>
        <p v-else class="text-sm text-muted">Aucune compétence publiée.</p>

        <div class="mt-6">
          <AppButton to="/competences" variant="ghost">
            Voir les compétences
            <ArrowRight class="size-4" aria-hidden="true" />
          </AppButton>
        </div>
      </section>
    </template>

    <p v-else class="text-sm text-muted">
      Les informations de profil ne sont pas encore disponibles.
      <RouterLink to="/contact" class="ml-1 text-gold hover:underline">Me contacter</RouterLink>
    </p>
  </div>
</template>

