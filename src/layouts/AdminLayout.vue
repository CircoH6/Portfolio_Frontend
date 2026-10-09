<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard, User, Link2, Layers, FolderKanban, Briefcase,
  GraduationCap, Award, Languages, FileText, MessageSquare, Settings,
  LogOut, Menu, X,
} from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { useProfileStore } from '@/stores/profile.store'
import { useToastStore } from '@/stores/toast.store'
import { messagesService } from '@/services/messages.service'
import AppAvatar from '@/components/common/AppAvatar.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const profileStore = useProfileStore()
const toast = useToastStore()
const { user } = storeToRefs(auth)
const { adminProfile } = storeToRefs(profileStore)

const drawerOpen = ref(false)
const unreadCount = ref(0)

const groups = [
  {
    label: 'Pilotage',
    items: [{ to: '/admin', name: 'admin-dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Contenus',
    items: [
      { to: '/admin/profile', name: 'admin-profile', label: 'Profil', icon: User },
      { to: '/admin/contact-methods', name: 'admin-contact-methods', label: 'Moyens de contact', icon: Link2 },
      { to: '/admin/skills', name: 'admin-skills', label: 'Compétences', icon: Layers },
      { to: '/admin/projects', name: 'admin-projects', label: 'Projets', icon: FolderKanban },
      { to: '/admin/experiences', name: 'admin-experiences', label: 'Expériences', icon: Briefcase },
      { to: '/admin/educations', name: 'admin-educations', label: 'Formations', icon: GraduationCap },
      { to: '/admin/certifications', name: 'admin-certifications', label: 'Certifications', icon: Award },
      { to: '/admin/languages', name: 'admin-languages', label: 'Langues', icon: Languages },
    ],
  },
  {
    label: 'CV',
    items: [{ to: '/admin/cv', name: 'admin-cv-list', label: 'Constructeur de CV', icon: FileText }],
  },
  {
    label: 'Échanges',
    items: [{ to: '/admin/messages', name: 'admin-messages', label: 'Messages', icon: MessageSquare }],
  },
  {
    label: 'Système',
    items: [{ to: '/admin/settings', name: 'admin-settings', label: 'Paramètres', icon: Settings }],
  },
]

const pageTitle = computed(() => route.meta.title || 'Administration')

const displayName = computed(
  () =>
    adminProfile.value?.full_name ||
    user.value?.name ||
    user.value?.email ||
    'Compte',
)

function isActive(item) {
  if (item.end) return route.name === item.name
  return route.matched.some((record) => record.name === item.name)
}

async function logout() {
  await auth.logout()
  profileStore.reset()
  toast.info('Vous êtes déconnecté.')
  router.push({ name: 'admin-login' })
}

onMounted(async () => {
  // Compteurs réels : uniquement ce que l'API fournit.
  profileStore.fetchAdmin().catch(() => {})
  try {
    const data = await messagesService.list({ per_page: 1 })
    unreadCount.value = data?.unread_count ?? 0
  } catch {
    unreadCount.value = 0 // pas de badge en cas d'échec
  }
})
</script>

<template>
  <div class="min-h-screen bg-ink">
    <!-- ================= Sidebar bureau ================= -->
    <aside
      class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-ink-2 lg:flex"
      aria-label="Navigation administration"
    >
      <div class="flex h-16 items-center gap-2 border-b border-line px-5">
        <RouterLink to="/" class="truncate font-serif text-lg text-paper hover:text-gold">
          {{ displayName }}
        </RouterLink>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4">
        <div v-for="group in groups" :key="group.label" class="mb-5">
          <p class="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gold-deep">
            {{ group.label }}
          </p>
          <RouterLink
            v-for="item in group.items"
            :key="item.name"
            :to="item.to"
            class="mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150"
            :class="
              isActive(item)
                ? 'bg-ink-3 text-gold'
                : 'text-muted hover:bg-ink-3 hover:text-paper'
            "
            :aria-current="isActive(item) ? 'page' : undefined"
          >
            <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
            <span class="flex-1">{{ item.label }}</span>
            <span
              v-if="item.name === 'admin-messages' && unreadCount > 0"
              class="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-ink"
            >
              {{ unreadCount }}
              <span class="sr-only">message(s) non lu(s)</span>
            </span>
          </RouterLink>
        </div>
      </nav>

      <div class="border-t border-line p-3">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-ink-3 hover:text-danger"
          @click="logout"
        >
          <LogOut class="size-4" aria-hidden="true" />
          Se déconnecter
        </button>
      </div>
    </aside>

    <!-- ================= Zone principale ================= -->
    <div class="lg:pl-64">
      <header class="sticky top-0 z-20 border-b border-line bg-ink-2">
        <div class="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
          <div class="flex min-w-0 items-center gap-3">
            <button
              type="button"
              class="rounded-lg border border-line-2 p-2 text-paper hover:border-gold hover:text-gold lg:hidden"
              :aria-expanded="drawerOpen"
              aria-controls="admin-drawer"
              :aria-label="drawerOpen ? 'Fermer la navigation' : 'Ouvrir la navigation'"
              @click="drawerOpen = !drawerOpen"
            >
              <X v-if="drawerOpen" class="size-5" aria-hidden="true" />
              <Menu v-else class="size-5" aria-hidden="true" />
            </button>
            <h1 class="truncate text-lg font-semibold text-paper md:text-xl">
              {{ pageTitle }}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <RouterLink to="/" class="link-quiet hidden text-sm sm:block">
              Voir le site
            </RouterLink>
            <span class="flex items-center gap-3">
              <AppAvatar
                :src="adminProfile?.profile_image || null"
                :name="displayName"
                size="sm"
                alt=""
              />
              <span class="hidden flex-col leading-tight sm:flex">
                <span class="max-w-[10rem] truncate text-sm font-medium text-paper">
                  {{ displayName }}
                </span>
                <span class="max-w-[10rem] truncate text-xs text-muted">
                  {{ user?.email }}
                </span>
              </span>
            </span>
          </div>
        </div>
      </header>

      <main class="px-4 py-6 md:px-8 md:py-8">
        <RouterView />
      </main>
    </div>


    <!-- ================= Drawer mobile ================= -->
    <Teleport to="body">
      <div
        v-if="drawerOpen"
        class="fixed inset-0 z-40 bg-black/70 lg:hidden"
        @mousedown.self="drawerOpen = false"
      >
        <nav
          id="admin-drawer"
          class="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-ink-2"
          aria-label="Navigation administration mobile"
        >
          <div class="flex h-16 items-center justify-between border-b border-line px-5">
            <span class="truncate font-serif text-lg text-paper">{{ displayName }}</span>
            <button
              type="button"
              class="rounded-lg p-1.5 text-muted hover:text-paper"
              aria-label="Fermer la navigation"
              @click="drawerOpen = false"
            >
              <X class="size-5" aria-hidden="true" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-3 py-4">
            <div v-for="group in groups" :key="group.label" class="mb-5">
              <p class="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gold-deep">
                {{ group.label }}
              </p>
              <RouterLink
                v-for="item in group.items"
                :key="item.name"
                :to="item.to"
                class="mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
                :class="
                  isActive(item)
                    ? 'bg-ink-3 text-gold'
                    : 'text-muted hover:bg-ink-3 hover:text-paper'
                "
                @click="drawerOpen = false"
              >
                <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
                <span class="flex-1">{{ item.label }}</span>
                <span
                  v-if="item.name === 'admin-messages' && unreadCount > 0"
                  class="rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-semibold text-ink"
                >
                  {{ unreadCount }}
                </span>
              </RouterLink>
            </div>

            <button
              type="button"
              class="mt-4 flex w-full items-center gap-3 rounded-lg border border-line-2 px-3 py-2.5 text-sm text-muted hover:border-danger hover:text-danger"
              @click="logout()"
            >
              <LogOut class="size-4" aria-hidden="true" />
              Se déconnecter
            </button>
          </div>
        </nav>
      </div>
    </Teleport>
  </div>
</template>

