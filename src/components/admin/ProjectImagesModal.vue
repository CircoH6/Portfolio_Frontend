<script setup>
import { ref } from 'vue'
import { ImagePlus, Trash2, Upload } from '@lucide/vue'
import { projectsService } from '@/services/projects.service'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'

/**
 * Gestion des images d'un projet — upload (multipart), légende/alt,
 * suppression. Le projet `project` est rechargé par le parent après action.
 * Validation locale alignée sur le backend : jpg/jpeg/png/webp ≤ 4 Mo.
 */
const props = defineProps({
  project: { type: Object, required: true },
})
const emit = defineEmits(['changed'])

const toast = useToastStore()
const confirmStore = useConfirmStore()

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 4 * 1024 * 1024

const fileInput = ref(null)
const pending = ref(null)
const previewUrl = ref('')
const alt = ref('')
const caption = ref('')
const uploading = ref(false)
const localError = ref('')

function reset() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  pending.value = null
  previewUrl.value = ''
  alt.value = ''
  caption.value = ''
  localError.value = ''
}

function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  localError.value = ''
  if (!file) return
  if (!ACCEPTED.includes(file.type)) {
    localError.value = 'Format accepté : JPG, PNG ou WebP.'
    return
  }
  if (file.size > MAX_SIZE) {
    localError.value = 'Fichier trop volumineux (4 Mo maximum).'
    return
  }
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  pending.value = file
  previewUrl.value = URL.createObjectURL(file)
}

async function upload() {
  if (!pending.value) return
  uploading.value = true
  localError.value = ''
  const form = new FormData()
  form.append('image', pending.value)
  if (alt.value) form.append('alt', alt.value)
  if (caption.value) form.append('caption', caption.value)
  try {
    await projectsService.addImage(props.project.id, form)
    toast.success('Image ajoutée.')
    reset()
    emit('changed')
  } catch (error) {
    localError.value = error?.message || "Échec de l'envoi de l'image."
  } finally {
    uploading.value = false
  }
}

async function remove(image) {
  const ok = await confirmStore.confirm({
    title: "Supprimer l'image",
    message: 'Supprimer définitivement cette image du projet ?',
    confirmLabel: 'Supprimer',
  })
  if (!ok) return
  try {
    await projectsService.deleteImage(image.id)
    toast.success('Image supprimée.')
    emit('changed')
  } catch (error) {
    toast.error(error?.message || 'Échec de la suppression.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Upload -->
    <div class="flex flex-col gap-4 rounded-xl border border-line bg-ink-3 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div
          v-if="previewUrl"
          class="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line-2 bg-ink-2"
        >
          <img :src="previewUrl" alt="Prévisualisation" class="size-full object-cover" />
        </div>
        <div class="flex flex-1 flex-col gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="sr-only"
              aria-label="Sélectionner une image de projet"
              @change="onFile"
            />
            <AppButton variant="secondary" type="button" @click="fileInput?.click()">
              <ImagePlus class="size-4" aria-hidden="true" />
              {{ pending ? 'Changer d\'image' : 'Choisir une image' }}
            </AppButton>
            <span v-if="pending" class="text-sm text-gold">{{ pending.name }}</span>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <AppInput v-model="alt" label="Texte alternatif" name="alt" placeholder="Décrit l'image" />
            <AppInput v-model="caption" label="Légende" name="caption" placeholder="Optionnelle" />
          </div>
          <AppButton v-if="pending" type="button" :loading="uploading" @click="upload">
            <Upload class="size-4" aria-hidden="true" />
            Envoyer l'image
          </AppButton>
        </div>
      </div>
      <p v-if="localError" class="text-sm text-danger" role="alert">{{ localError }}</p>
      <p class="text-xs text-muted">JPG, PNG ou WebP — 4 Mo maximum.</p>
    </div>

    <!-- Images existantes -->
    <div>
      <h4 class="mb-3 text-sm font-semibold text-paper">
        Images du projet ({{ project.images?.length || 0 }})
      </h4>
      <p v-if="!project.images?.length" class="text-sm text-muted">
        Aucune image pour ce projet.
      </p>
      <ul v-else class="grid gap-3 sm:grid-cols-2">
        <li
          v-for="image in project.images"
          :key="image.id"
          class="flex items-center gap-3 rounded-lg border border-line bg-ink-3 p-3"
        >
          <img
            :src="image.path"
            :alt="image.alt || image.caption || 'Image du projet'"
            class="size-16 shrink-0 rounded object-cover"
            loading="lazy"
          />
          <div class="min-w-0 flex-1">
            <p v-if="image.caption" class="truncate text-sm text-paper">{{ image.caption }}</p>
            <p v-if="image.alt" class="truncate text-xs text-muted">Alt : {{ image.alt }}</p>
          </div>
          <AppButton
            variant="danger"
            size="sm"
            type="button"
            :aria-label="`Supprimer l'image ${image.id}`"
            @click="remove(image)"
          >
            <Trash2 class="size-4" aria-hidden="true" />
          </AppButton>
        </li>
      </ul>
    </div>
  </div>
</template>
