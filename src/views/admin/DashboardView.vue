<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  FolderKanban, Layers, FileText, MessageSquare, ArrowRight,
} from '@lucide/vue'
import { projectsService } from '@/services/projects.service'
import { skillsService } from '@/services/skills.service'
import { cvService } from '@/services/cv.service'
import { messagesService, MESSAGE_STATUS_LABELS } from '@/services/messages.service'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import LoadingState from '@/components/common/LoadingState.vue'

const auth = useAuthStore()

/**
 * Statistiques — uniquement des compteurs réels fournis par l'API.
 * Un indicateur en échec reste masqué (jamais de valeur inventée).
 */
const stats = ref([])
const recentMessages = ref([])
const loading = ref(true)
const failed = ref(false)

const statCards = [
  { key: 'projects', label: 'Projets au total', icon: FolderKanban, to: '/admin/projects' },
  { key: 'skills', label: 'Compétences', icon: Layers, to: '/admin/skills' },
  { key: 'cvs', label: 'Versions de CV', icon: FileText, to: '/admin/cv' },
  { key: 'unread', label: 'Messages non lus', icon: MessageSquare, to: '/admin/messages' },
]

onMounted(async () => {
  try {
    const map = {}

    try {
      const projects = await projectsService.admin.list({ per_page: 1 })
      map.projects = projects?.pagination?.total ?? null
    } catch { /* indicateur masqué en cas d'échec */ }

    try {
      const skills = await skillsService.admin.list()
      map.skills = Array.isArray(skills) ? skills.length : null
    } catch { /* indicateur masqué */ }

    try {
      const cvs = await cvService.admin.list()
      map.cvs = Array.isArray(cvs) ? cvs.length : null
    } catch { /* indicateur masqué */ }

    try {
      const messages = await messagesService.list({ per_page: 5 })
      map.unread = messages?.unread_count ?? null
      recentMessages.value = (messages?.messages || []).slice(0, 5)
    } catch { /* indicateur masqué */ }

    stats.value = statCards.map((card) => ({ ...card, value: map[card.key] }))
    failed.value = Object.values(map).every((value) => value === null)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <header class="flex flex-col gap-1">
      <p class="text-sm text-muted">
        Bonjour{{ auth.user?.name ? ` ${auth.user.name}` : '' }} — voici l'état
        actuel du portfolio.
      </p>
    </header>

    <!-- Compteurs réels -->
    <LoadingState v-if="loading" compact label="Chargement des indicateurs…" />
    <p v-else-if="failed" class="text-sm text-muted">
      Les indicateurs sont momentanément indisponibles.
    </p>

    <section v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs">
      <RouterLink
        v-for="card in stats"
        :key="card.key"
        :to="card.to"
        class="panel group flex flex-col gap-3 p-5 transition-colors hover:border-gold/40"
      >
        <div class="flex items-center justify-between">
          <span class="flex size-10 items-center justify-center rounded-lg border border-line-2 text-gold">
            <component :is="card.icon" class="size-5" aria-hidden="true" />
          </span>
          <ArrowRight
            class="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-gold"
            aria-hidden="true"
          />
        </div>
        <p class="text-3xl font-semibold text-paper">
          {{ card.value ?? '—' }}
        </p>
        <p class="text-sm text-muted">{{ card.label }}</p>
      </RouterLink>
    </section>

    <!-- Messages récents (données réelles, extrait de l'API) -->
    <section aria-labelledby="recent-messages" class="panel">
      <div class="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="recent-messages" class="font-semibold text-paper">
          Messages récents
        </h2>
        <RouterLink to="/admin/messages" class="link-quiet text-sm">
          Tout voir
        </RouterLink>
      </div>

      <p v-if="recentMessages.length === 0" class="px-5 py-8 text-sm text-muted">
        Aucun message reçu pour le moment.
      </p>
      <ul v-else class="divide-y divide-line">
        <li
          v-for="message in recentMessages"
          :key="message.id"
          class="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-paper">
              {{ message.subject }}
            </p>
            <p class="truncate text-xs text-muted">
              {{ message.name }} · {{ message.email }}
            </p>
          </div>
          <AppBadge
            :tone="message.status === 'new' ? 'gold' : message.status === 'replied' ? 'success' : 'neutral'"
          >
            {{ MESSAGE_STATUS_LABELS[message.status] || message.status }}
          </AppBadge>
        </li>
      </ul>
    </section>

    <!-- Actions rapides -->
    <section class="flex flex-wrap gap-3" aria-label="Actions rapides">
      <AppButton to="/admin/profile">Gérer le profil</AppButton>
      <AppButton to="/admin/cv" variant="secondary">Construire un CV</AppButton>
      <AppButton to="/admin/projects" variant="secondary">Ajouter un projet</AppButton>
    </section>
  </div>
</template>
