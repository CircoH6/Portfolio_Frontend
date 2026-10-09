<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { MapPin } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile.store'
import ContactMethods from '@/components/portfolio/ContactMethods.vue'

const profileStore = useProfileStore()
const { publicProfile: profile } = storeToRefs(profileStore)

const year = new Date().getFullYear()

const brand = computed(() => profile.value?.full_name || null)
const title = computed(() => profile.value?.professional_title || null)

const navLinks = [
  { to: '/a-propos', label: 'À propos' },
  { to: '/competences', label: 'Compétences' },
  { to: '/projets', label: 'Projets' },
  { to: '/parcours', label: 'Parcours' },
  { to: '/cv', label: 'CV' },
  { to: '/contact', label: 'Contact' },
]
</script>

<template>
  <footer class="border-t border-line bg-ink-2">
    <div class="container-page grid gap-10 py-12 md:grid-cols-3 md:py-16">
      <!-- Identité (API) -->
      <div class="flex flex-col gap-3">
        <p class="font-serif text-xl text-paper">{{ brand || 'Portfolio' }}</p>
        <p v-if="title" class="text-sm text-gold">{{ title }}</p>
        <p v-if="profile?.location" class="flex items-center gap-1.5 text-sm text-muted">
          <MapPin class="size-4 shrink-0" aria-hidden="true" />
          {{ profile.location }}
        </p>
        <p class="max-w-xs text-sm leading-relaxed text-muted">
          {{ profile?.short_bio || 'Site personnel : profil, projets, parcours et CV.' }}
        </p>
      </div>

      <!-- Navigation -->
      <nav aria-label="Navigation de pied de page" class="flex flex-col gap-2">
        <p class="mb-2 text-sm font-semibold uppercase tracking-wider text-gold-deep">
          Navigation
        </p>
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="link-quiet w-fit text-sm"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <!-- Coordonnées publiques -->
      <div class="flex flex-col gap-3">
        <p class="mb-2 text-sm font-semibold uppercase tracking-wider text-gold-deep">
          Contact
        </p>
        <ContactMethods :methods="profile?.contact_methods || []" />
      </div>
    </div>

    <div class="border-t border-line">
      <div
        class="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row"
      >
        <p>© {{ year }} {{ brand || 'Portfolio' }} — Tous droits réservés.</p>
        <RouterLink to="/admin/login" class="link-quiet">Espace administration</RouterLink>
      </div>
    </div>
  </footer>
</template>
