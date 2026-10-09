<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, MapPin, Download, FolderKanban } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile.store'
import { useAsync } from '@/composables/useAsync'
import { usePageMeta } from '@/composables/usePageMeta'
import { skillsService } from '@/services/skills.service'
import { projectsService } from '@/services/projects.service'
import { experiencesService } from '@/services/experiences.service'
import { educationsService } from '@/services/educations.service'
import SectionHeading from '@/components/portfolio/SectionHeading.vue'
import ProjectCard from '@/components/portfolio/ProjectCard.vue'
import TimelineList from '@/components/portfolio/TimelineList.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppButton from '@/components/common/AppButton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

usePageMeta(
  'Accueil',
  'Portfolio professionnel — projets, compétences, parcours et CV.',
)

const profileStore = useProfileStore()
const { publicProfile: profile, publicStatus, publicError } = storeToRefs(profileStore)

onMounted(() => {
  profileStore.fetchPublic().catch(() => {})
})

const skills = useAsync(() => skillsService.listPublic(), { initial: [] })
const featured = useAsync(
  () => projectsService.listPublic({ featured: 1, per_page: 3 }),
  { initial: null },
)
const experiences = useAsync(() => experiencesService.listPublic(), { initial: [] })
const educations = useAsync(() => educationsService.listPublic(), { initial: [] })

/** Aperçu du parcours : dernières expériences puis formations, tri réel. */
const journeyPreview = computed(() => {
  const entries = [
    ...(experiences.data.value || []).map((e) => ({ ...e, _kind: 'experience' })),
    ...(educations.data.value || []).map((e) => ({ ...e, _kind: 'education' })),
  ]
  entries.sort((a, b) => String(b.start_date || '').localeCompare(String(a.start_date || '')))
  return entries.slice(0, 3)
})

const skillSelection = computed(() => (skills.data.value || []).slice(0, 14))
const featuredProjects = computed(() => featured.data.value?.projects || [])
</script>

<template>
  <div>
    <!-- ============================ HERO ============================ -->
    <section class="relative overflow-hidden border-b border-line" aria-labelledby="hero-title">
      <div class="container-page flex flex-col items-start gap-8 py-16 md:flex-row md:items-center md:gap-14 md:py-24">
        <!-- Contenu -->
        <div class="animate-rise flex-1">
          <p class="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
            Portfolio professionnel
          </p>

          <template v-if="publicStatus === 'loading'">
            <LoadingState compact label="Chargement du profil…" />
          </template>

          <template v-else-if="publicStatus === 'error'">
            <div class="max-w-xl">
              <ErrorState :error="publicError" @retry="profileStore.fetchPublic(true).catch(() => {})" />
            </div>
          </template>

          <template v-else-if="profile">
            <h1
              id="hero-title"
              class="text-4xl font-semibold leading-tight text-paper md:text-5xl lg:text-6xl"
            >
              {{ profile.full_name || 'Profil en cours de configuration' }}
            </h1>
            <p
              v-if="profile.professional_title"
              class="mt-3 font-serif text-xl text-gold md:text-2xl"
            >
              {{ profile.professional_title }}
            </p>
            <p class="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
              {{ profile.short_bio || 'Aucune présentation renseignée pour le moment.' }}
            </p>
            <p
              v-if="profile.location"
              class="mt-4 flex items-center gap-1.5 text-sm text-muted"
            >
              <MapPin class="size-4 text-gold-deep" aria-hidden="true" />
              {{ profile.location }}
            </p>

            <div class="mt-8 flex flex-wrap items-center gap-3">
              <AppButton to="/projets" size="lg">
                <FolderKanban class="size-4" aria-hidden="true" />
                Consulter les projets
              </AppButton>
              <AppButton to="/cv" variant="secondary" size="lg">
                <Download class="size-4" aria-hidden="true" />
                Voir mon CV
              </AppButton>
            </div>
          </template>

          <!-- Aucun profil disponible : état discret, pas de contenu inventé -->
          <template v-else>
            <p class="max-w-xl text-base text-muted">
              Les informations de profil ne sont pas encore disponibles.
            </p>
          </template>
        </div>

        <!-- Photo -->
        <div class="animate-rise mx-auto md:mx-0" style="animation-delay: 0.12s">
          <AppAvatar
            :src="profile?.profile_image || null"
            :name="profile?.full_name || '·'"
            size="xl"
            :alt="`Photo de ${profile?.full_name || 'profil'}`"
            class="size-40 md:size-56 lg:size-64 [&>span]:text-5xl [&>span]:md:text-6xl"
          />
          <span
            class="mx-auto mt-4 block w-fit rounded-full border border-gold/40 px-4 py-1 font-mono text-xs text-gold"
          >
            &lt;dev /&gt;
          </span>
        </div>
      </div>
    </section>

      <!-- ======================= À PROPOS ======================= -->
      <section class="container-page py-16 md:py-24" aria-labelledby="about-heading">
        <div class="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            id="about-heading"
            eyebrow="À propos"
            title="Construire des produits utiles, avec rigueur."
          />
          <div class="flex flex-col gap-4">
            <p class="whitespace-pre-line leading-relaxed text-muted">
              {{ profile?.long_bio || profile?.short_bio || 'Aucune biographie disponible pour le moment.' }}
            </p>
            <RouterLink
              to="/a-propos"
              class="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-gold hover:opacity-80"
            >
              En savoir plus
              <ArrowRight class="size-4" aria-hidden="true" />
            </RouterLink>
          </div>
        </div>
      </section>

      <hr class="rule-gold container-page" />

      <!-- ======================= COMPÉTENCES ======================= -->
      <section class="container-page py-16 md:py-24" aria-labelledby="skills-heading">
        <SectionHeading
          id="skills-heading"
          eyebrow="Savoir-faire"
          title="Compétences techniques"
          description="Les technologies maîtrisées et utilisées sur les projets."
        />

        <LoadingState v-if="skills.loading.value" compact />
        <ErrorState
          v-else-if="skills.error.value"
          :error="skills.error.value"
          @retry="skills.reload"
        />
        <ul
          v-else-if="skillSelection.length"
          class="flex flex-wrap gap-2"
          aria-label="Aperçu des compétences"
        >
          <li
            v-for="skill in skillSelection"
            :key="skill.id"
            class="flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-paper transition-colors duration-200 hover:border-gold/50"
          >
            <img
              v-if="skill.icon && /^(https?:|\/|data:)/.test(skill.icon)"
              :src="skill.icon"
              :alt="`Icône ${skill.name}`"
              class="size-4 object-contain"
              loading="lazy"
            />
            {{ skill.name }}
          </li>
        </ul>
        <p v-else class="text-sm text-muted">Aucune compétence publiée pour le moment.</p>

        <div class="mt-8">
          <AppButton to="/competences" variant="ghost">
            Toutes les compétences
            <ArrowRight class="size-4" aria-hidden="true" />
          </AppButton>
        </div>
      </section>

      <hr class="rule-gold container-page" />

      <!-- ======================= PROJETS EN VEDETTE ======================= -->
      <section class="container-page py-16 md:py-24" aria-labelledby="projects-heading">
        <SectionHeading
          id="projects-heading"
          eyebrow="Réalisations"
          title="Projets mis en avant"
          description="Avec leur contexte et leur état d'avancement réel."
        />

        <LoadingState v-if="featured.loading.value" compact />
        <ErrorState
          v-else-if="featured.error.value"
          :error="featured.error.value"
          @retry="featured.reload"
        />
        <div
          v-else-if="featuredProjects.length"
          class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <ProjectCard
            v-for="project in featuredProjects"
            :key="project.id"
            :project="project"
            featured
          />
        </div>
        <p v-else class="text-sm text-muted">Aucun projet en vedette pour le moment.</p>

        <div class="mt-8">
          <AppButton to="/projets" variant="ghost">
            Tous les projets
            <ArrowRight class="size-4" aria-hidden="true" />
          </AppButton>
        </div>
      </section>


      <hr class="rule-gold container-page" />

      <!-- ======================= PARCOURS ======================= -->
      <section class="container-page py-16 md:py-24" aria-labelledby="journey-heading">
        <SectionHeading
          id="journey-heading"
          eyebrow="Parcours"
          title="Expériences et formations"
        />

        <LoadingState
          v-if="experiences.loading.value || educations.loading.value"
          compact
        />
        <div v-else-if="journeyPreview.length" class="grid gap-6 lg:grid-cols-2">
          <div v-for="entry in journeyPreview" :key="`${entry._kind}-${entry.id}`">
            <TimelineList :items="[entry]" :mode="entry._kind" />
          </div>
        </div>
        <p v-else class="text-sm text-muted">Aucun élément de parcours publié.</p>

        <div class="mt-8">
          <AppButton to="/parcours" variant="ghost">
            Voir le parcours complet
            <ArrowRight class="size-4" aria-hidden="true" />
          </AppButton>
        </div>
      </section>

      <!-- ======================= CONTACT ======================= -->
      <section class="border-t border-line bg-ink-2" aria-labelledby="cta-heading">
        <div class="container-page flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <div>
            <h2 id="cta-heading" class="text-2xl font-semibold text-paper md:text-3xl">
              Un projet, une opportunité&nbsp;?
            </h2>
            <p class="mt-2 max-w-xl text-muted">
              Parlons-en — coordonnées publiques et formulaire de contact
              disponibles.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <AppButton to="/contact" size="lg">Me contacter</AppButton>
            <AppButton to="/cv" variant="secondary" size="lg">
              Consulter le CV
            </AppButton>
          </div>
        </div>
      </section>
    </div>
</template>

