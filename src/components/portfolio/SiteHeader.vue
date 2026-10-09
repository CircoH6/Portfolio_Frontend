<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Menu, X, Mail } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile.store'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const profileStore = useProfileStore()
const { publicProfile: profile } = storeToRefs(profileStore)

const menuOpen = ref(false)

const brand = computed(() => profile.value?.full_name || null)

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/competences', label: 'Compétences' },
  { to: '/projets', label: 'Projets' },
  { to: '/parcours', label: 'Parcours' },
  { to: '/cv', label: 'CV' },
]

// Fermeture à la navigation.
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

function onKeydown(event) {
  if (event.key === 'Escape') menuOpen.value = false
}
document.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line bg-ink-2">
    <div class="container-page flex h-16 items-center justify-between gap-4 md:h-20">
      <!-- Nom / logo textuel : issu du profil API, jamais codé en dur -->
      <RouterLink to="/" class="group flex items-baseline gap-2" aria-label="Retour à l'accueil">
        <span class="font-serif text-lg tracking-wide text-paper transition-colors group-hover:text-gold md:text-xl">
          {{ brand || 'Portfolio' }}
        </span>
        <span class="hidden size-1.5 rounded-full bg-gold sm:block" aria-hidden="true" />
      </RouterLink>

      <!-- Navigation bureau -->
      <nav class="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-lg px-3 py-2 text-sm transition-colors duration-200"
          :class="
            route.path === link.to
              ? 'text-gold'
              : 'text-muted hover:text-paper'
          "
          :aria-current="route.path === link.to ? 'page' : undefined"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="flex items-center gap-2">
        <AppButton to="/contact" size="sm" class="hidden sm:inline-flex" variant="secondary">
          <Mail class="size-4" aria-hidden="true" />
          Contact
        </AppButton>

        <!-- Bouton menu mobile -->
        <button
          type="button"
          class="rounded-lg border border-line-2 p-2 text-paper transition-colors hover:border-gold hover:text-gold lg:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" class="size-5" aria-hidden="true" />
          <Menu v-else class="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Navigation mobile -->
    <nav
      v-if="menuOpen"
      id="mobile-menu"
      class="border-t border-line bg-ink-2 lg:hidden"
      aria-label="Navigation mobile"
    >
      <div class="container-page flex flex-col gap-1 py-4">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-lg px-3 py-2.5 text-base transition-colors"
          :class="route.path === link.to ? 'bg-ink-3 text-gold' : 'text-muted hover:bg-ink-3 hover:text-paper'"
          :aria-current="route.path === link.to ? 'page' : undefined"
        >
          {{ link.label }}
        </RouterLink>
        <RouterLink
          to="/contact"
          class="mt-2 rounded-lg bg-gold px-3 py-2.5 text-center text-base font-medium text-ink"
        >
          Me contacter
        </RouterLink>
      </div>
    </nav>
  </header>
</template>
