<script setup>
import { ref, computed } from 'vue'
import { Mail, Trash2, Eye, Archive, Reply } from '@lucide/vue'
import { messagesService, MESSAGE_STATUSES, MESSAGE_STATUS_LABELS } from '@/services/messages.service'
import { useCrud } from '@/composables/useCrud'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import AppBadge from '@/components/common/AppBadge.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const toast = useToastStore()
const confirmStore = useConfirmStore()
const crud = useCrud(messagesService)

const page = ref(1)
const statusFilter = ref('')
const opened = ref(null) // message consulté
const updating = ref(false)

const columns = [
  { key: 'name', label: 'Expéditeur' },
  { key: 'subject', label: 'Sujet' },
  { key: 'status', label: 'Statut' },
  { key: 'created_at', label: 'Reçu le' },
]

const statusTone = (s) =>
  s === 'new' ? 'gold' : s === 'replied' ? 'success' : s === 'archived' ? 'neutral' : 'neutral'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const pagination = computed(() => crud.pagination.value)
const unreadCount = computed(() => crud.extra.value ?? 0)

function load() {
  const params = { page: page.value, per_page: 20 }
  if (statusFilter.value) params.status = statusFilter.value
  return crud.load(params)
}

load().catch(() => {})

async function open(message) {
  try {
    opened.value = await messagesService.get(message.id)
    // Rafraîchit la liste (le statut 'new' → 'read' a changé côté serveur).
    if (message.status === 'new') {
      page.value = 1
      await load()
    }
  } catch (error) {
    toast.error(error?.message || 'Impossible d\'ouvrir le message.')
  }
}

async function changeStatus(message, status) {
  updating.value = true
  try {
    opened.value = await messagesService.updateStatus(message.id, status)
    toast.success('Statut mis à jour.')
    await load()
  } catch (error) {
    toast.error(error?.message || 'Échec de la mise à jour du statut.')
  } finally {
    updating.value = false
  }
}

async function remove(message) {
  const ok = await confirmStore.confirm({
    title: 'Supprimer le message',
    message: `Supprimer le message de ${message.name} ? Cette action est définitive.`,
    confirmLabel: 'Supprimer',
  })
  if (!ok) return
  try {
    await messagesService.remove(message.id)
    toast.success('Message supprimé.')
    if (opened.value?.id === message.id) opened.value = null
    if (crud.items.value.length === 1 && page.value > 1) page.value -= 1
    await load()
  } catch (error) {
    toast.error(error?.message || 'Échec de la suppression.')
  }
}

function goToPage(next) {
  page.value = next
  load().catch(() => {})
}
</script>


<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="max-w-2xl text-sm text-muted">
          Messages reçus via le formulaire de contact.
        </p>
        <p v-if="unreadCount > 0" class="mt-1 text-sm text-gold">
          {{ unreadCount }} message{{ unreadCount > 1 ? 's' : '' }} non lu{{ unreadCount > 1 ? 's' : '' }}.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <label for="msg-filter" class="text-sm text-muted">Statut</label>
        <select
          id="msg-filter"
          v-model="statusFilter"
          class="rounded-lg border border-line bg-ink-3 px-3 py-2 text-sm text-paper focus:border-gold focus:outline-none"
          @change="page = 1; load()"
        >
          <option value="">Tous</option>
          <option v-for="s in MESSAGE_STATUSES" :key="s" :value="s">
            {{ MESSAGE_STATUS_LABELS[s] }}
          </option>
        </select>
      </div>
    </div>

    <LoadingState v-if="crud.loading.value" label="Chargement…" />
    <ErrorState v-else-if="crud.error.value" :error="crud.error.value" @retry="load()" />

    <template v-else>
      <div class="panel hidden overflow-hidden md:block">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-line bg-ink-3">
            <tr>
              <th v-for="col in columns" :key="col.key" scope="col" class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                {{ col.label }}
              </th>
              <th scope="col" class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-for="m in crud.items.value" :key="m.id" class="transition-colors hover:bg-ink-3/60" :class="m.status === 'new' ? 'bg-gold/5' : ''">
              <td class="px-4 py-3">
                <div class="font-medium text-paper">{{ m.name }}</div>
                <div class="text-xs text-muted">{{ m.email }}</div>
              </td>
              <td class="max-w-xs px-4 py-3">
                <span class="block truncate text-paper">{{ m.subject || '—' }}</span>
              </td>
              <td class="px-4 py-3">
                <AppBadge :tone="statusTone(m.status)">{{ MESSAGE_STATUS_LABELS[m.status] || m.status }}</AppBadge>
              </td>
              <td class="px-4 py-3 text-sm text-muted">{{ formatDate(m.created_at) }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1.5">
                  <button
                    type="button"
                    class="rounded-lg border border-line-2 p-2 text-muted transition-colors hover:border-gold hover:text-gold"
                    :aria-label="`Lire le message de ${m.name}`"
                    @click="open(m)"
                  >
                    <Eye class="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-line-2 p-2 text-muted transition-colors hover:border-danger hover:text-danger"
                    :aria-label="`Supprimer le message de ${m.name}`"
                    @click="remove(m)"
                  >
                    <Trash2 class="size-4" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="crud.items.value.length === 0">
              <td colspan="5" class="px-4 py-10 text-center text-muted">Aucun message.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile : cartes -->
      <div class="flex flex-col gap-3 md:hidden">
        <article
          v-for="m in crud.items.value"
          :key="m.id"
          class="panel p-4"
          :class="m.status === 'new' ? 'border-gold/40' : ''"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-paper">{{ m.name }}</p>
              <p class="truncate text-xs text-muted">{{ m.email }}</p>
            </div>
            <AppBadge :tone="statusTone(m.status)">{{ MESSAGE_STATUS_LABELS[m.status] || m.status }}</AppBadge>
          </div>
          <p class="mt-2 truncate text-sm text-paper">{{ m.subject || '—' }}</p>
          <p class="mt-1 text-xs text-muted">{{ formatDate(m.created_at) }}</p>
          <div class="mt-3 flex justify-end gap-2 border-t border-line pt-3">
            <button
              type="button"
              class="rounded-lg border border-line-2 p-2 text-muted transition-colors hover:border-gold hover:text-gold"
              :aria-label="`Lire le message de ${m.name}`"
              @click="open(m)"
            >
              <Eye class="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="rounded-lg border border-line-2 p-2 text-muted transition-colors hover:border-danger hover:text-danger"
              :aria-label="`Supprimer le message de ${m.name}`"
              @click="remove(m)"
            >
              <Trash2 class="size-4" aria-hidden="true" />
            </button>
          </div>
        </article>
        <p v-if="crud.items.value.length === 0" class="panel px-4 py-10 text-center text-sm text-muted">Aucun message.</p>
      </div>

      <AppPagination v-if="pagination" :pagination="pagination" :disabled="crud.loading.value" @change="goToPage" />
    </template>


    <!-- Détail -->
    <AppModal
      :open="Boolean(opened)"
      :title="`Message de ${opened?.name || ''}`"
      size="lg"
      @close="opened = null"
    >
      <div v-if="opened" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <a :href="`mailto:${opened.email}`" class="text-gold hover:underline">{{ opened.email }}</a>
          <span class="text-muted">{{ formatDate(opened.created_at) }}</span>
          <AppBadge :tone="statusTone(opened.status)">{{ MESSAGE_STATUS_LABELS[opened.status] }}</AppBadge>
        </div>
        <h3 v-if="opened.subject" class="text-lg font-semibold text-paper">{{ opened.subject }}</h3>
        <p class="whitespace-pre-wrap text-sm leading-relaxed text-paper">{{ opened.message }}</p>

        <div class="flex flex-wrap gap-3 border-t border-line pt-4">
          <AppButton :href="`mailto:${opened.email}?subject=${encodeURIComponent('Re: ' + (opened.subject || ''))}`" variant="secondary">
            <Reply class="size-4" aria-hidden="true" />
            Répondre par e-mail
          </AppButton>
          <AppButton
            v-if="opened.status !== 'replied'"
            variant="secondary"
            type="button"
            :loading="updating"
            @click="changeStatus(opened, 'replied')"
          >
            Marquer comme répondu
          </AppButton>
          <AppButton
            v-if="opened.status !== 'archived'"
            variant="ghost"
            type="button"
            :loading="updating"
            @click="changeStatus(opened, 'archived')"
          >
            <Archive class="size-4" aria-hidden="true" />
            Archiver
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>
