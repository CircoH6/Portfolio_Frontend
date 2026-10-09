<script setup>
import { ref, watch } from 'vue'
import { Camera, Trash2, Upload, X } from '@lucide/vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppButton from '@/components/common/AppButton.vue'

/**
 * Envoi de la photo de profil — validation locale (mimes + poids) alignée
 * sur le backend (jpg/jpeg/png/webp ≤ 4 Mo). L'URL n'est considérée mise
 * à jour qu'après réponse positive de l'API (le parent met à jour `image`).
 */
const props = defineProps({
  image: { type: String, default: null },
  name: { type: String, default: '' },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['upload', 'remove'])

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 4 * 1024 * 1024

const input = ref(null)
const previewUrl = ref(null)
const pendingFile = ref(null)
const error = ref('')

watch(
  () => props.image,
  () => {
    // L'API a confirmé : on abandonne la prévisualisation locale.
    clearPreview(false)
  },
)

function pick() {
  error.value = ''
  input.value?.click()
}

function onFileSelected(event) {
  const file = event.target.files?.[0]
  event.target.value = '' // permettre de resélectionner le même fichier
  error.value = ''

  if (!file) return
  if (!ACCEPTED.includes(file.type)) {
    error.value = 'Format accepté : JPG, PNG ou WebP.'
    return
  }
  if (file.size > MAX_SIZE) {
    error.value = 'Fichier trop volumineux (4 Mo maximum).'
    return
  }

  clearPreview(false)
  pendingFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function clearPreview(revoke = true) {
  if (previewUrl.value && revoke) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
  pendingFile.value = null
}

async function send() {
  if (!pendingFile.value) return
  const file = pendingFile.value
  emit('upload', file)
}

async function removePhoto() {
  emit('remove')
}
</script>

<template>
  <section class="panel p-6" aria-labelledby="photo-heading">
    <h2 id="photo-heading" class="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-deep">
      Photo de profil
    </h2>

    <div class="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      <AppAvatar
        :src="previewUrl || image"
        :name="name"
        size="lg"
        :alt="previewUrl ? 'Prévisualisation de la nouvelle photo' : `Photo actuelle de ${name}`"
      />

      <div class="flex flex-1 flex-col gap-3">
        <input
          ref="input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="sr-only"
          aria-label="Sélectionner une image de profil"
          @change="onFileSelected"
        />

        <p v-if="pendingFile" class="text-sm text-gold">
          Nouvelle photo sélectionnée : {{ pendingFile.name }}
        </p>
        <p v-else-if="image" class="text-sm text-muted">
          Photo actuelle enregistrée.
        </p>
        <p v-else class="text-sm text-muted">
          Aucune photo — un avatar par défaut est affiché.
        </p>

        <p v-if="error" class="text-sm text-danger" role="alert">{{ error }}</p>

        <div class="flex flex-wrap gap-3">
          <AppButton variant="secondary" type="button" @click="pick">
            <Camera class="size-4" aria-hidden="true" />
            {{ image ? 'Remplacer' : 'Choisir une photo' }}
          </AppButton>

          <AppButton
            v-if="pendingFile"
            type="button"
            :loading="saving"
            @click="send"
          >
            <Upload class="size-4" aria-hidden="true" />
            Envoyer la photo
          </AppButton>

          <AppButton
            v-if="pendingFile"
            variant="ghost"
            type="button"
            @click="clearPreview()"
          >
            <X class="size-4" aria-hidden="true" />
            Annuler
          </AppButton>

          <AppButton
            v-if="image && !pendingFile"
            variant="danger"
            type="button"
            :loading="saving"
            @click="removePhoto"
          >
            <Trash2 class="size-4" aria-hidden="true" />
            Supprimer
          </AppButton>
        </div>

        <p class="text-xs text-muted">Formats acceptés : JPG, PNG, WebP — 4 Mo maximum.</p>
      </div>
    </div>
  </section>
</template>
