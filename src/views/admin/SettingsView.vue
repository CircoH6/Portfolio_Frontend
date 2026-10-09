<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { LogOut, ExternalLink, Info } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { useToastStore } from '@/stores/toast.store'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import { API_BASE_URL } from '@/services/api.js'

const router = useRouter()
const auth = useAuthStore()
const profileStore = useProfileStore()
const toast = useToastStore()
const { user } = storeToRefs(auth)
const { adminProfile } = storeToRefs(profileStore)

const displayName = computed(
  () => adminProfile.value?.full_name || user.value?.name || user.value?.email || 'Compte',
)

onMounted(() => {
  profileStore.fetchAdmin().catch(() => {})
})

async function logout() {
  await auth.logout()
  profileStore.reset()
  toast.info('Vous êtes déconnecté.')
  router.push({ name: 'admin-login' })
}
</script>


<template>
  <div class="flex max-w-3xl flex-col gap-6">
    <p class="text-sm text-muted">
      Paramètres du compte et informations de configuration.
    </p>

    <!-- Compte -->
    <section class="panel p-6" aria-labelledby="account-heading">
      <h2 id="account-heading" class="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-deep">
        Compte administrateur
      </h2>
      <div class="flex items-center gap-4">
        <AppAvatar
          :src="adminProfile?.profile_image || null"
          :name="displayName"
          size="lg"
          :alt="`Photo de ${displayName}`"
        />
        <div class="min-w-0">
          <p class="font-medium text-paper">{{ displayName }}</p>
          <p v-if="user?.email" class="truncate text-sm text-muted">{{ user.email }}</p>
          <AppBadge tone="gold">Administrateur</AppBadge>
        </div>
      </div>
      <div class="mt-5 flex flex-wrap gap-3">
        <AppButton :to="{ name: 'admin-profile' }" variant="secondary">Modifier le profil</AppButton>
        <AppButton variant="ghost" type="button" @click="logout">
          <LogOut class="size-4" aria-hidden="true" />
          Se déconnecter
        </AppButton>
      </div>
    </section>

    <!-- Configuration API -->
    <section class="panel p-6" aria-labelledby="api-heading">
      <h2 id="api-heading" class="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-deep">
        Configuration de l'application
      </h2>
      <dl class="flex flex-col gap-2 text-sm">
        <div class="flex items-center justify-between gap-3">
          <dt class="text-muted">API utilisée</dt>
          <dd class="truncate font-mono text-xs text-paper">{{ API_BASE_URL }}</dd>
        </div>
        <div class="flex items-center justify-between gap-3">
          <dt class="text-muted">Authentification</dt>
          <dd class="text-paper">Jeton Bearer (Sanctum)</dd>
        </div>
      </dl>
      <p class="mt-3 flex items-start gap-2 text-xs text-muted">
        <Info class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Modifiable via la variable d'environnement
        <code class="rounded bg-ink-3 px-1 py-0.5">VITE_API_URL</code> — le site public est géré depuis l'accueil.
      </p>
    </section>

    <!-- Note honnête -->
    <section class="panel p-6" aria-labelledby="note-heading">
      <h2 id="note-heading" class="mb-2 text-sm font-semibold uppercase tracking-wider text-gold-deep">
        À propos de cette page
      </h2>
      <p class="text-sm leading-relaxed text-muted">
        Le backend n'expose pas encore d'endpoint dédié aux paramètres globaux
        (<code class="rounded bg-ink-3 px-1 py-0.5">/admin/settings</code>). Cette page affiche
        donc les informations réelles du compte et de la connexion. Les préférences d'affichage
        pourront y être ajoutées dès que l'API les prendra en charge.
      </p>
      <p class="mt-3 text-sm text-muted">
        <RouterLink :to="{ name: 'home' }" class="inline-flex items-center gap-1 text-gold hover:underline">
          Voir le site public
          <ExternalLink class="size-3.5" aria-hidden="true" />
        </RouterLink>
      </p>
    </section>
  </div>
</template>
