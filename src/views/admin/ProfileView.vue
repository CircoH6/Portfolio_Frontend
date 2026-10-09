<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { Save } from '@lucide/vue'
import { useProfileStore } from '@/stores/profile.store'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { usePageMeta } from '@/composables/usePageMeta'
import { validate, backendErrorsToMap } from '@/utils/validators'
import { ApiError } from '@/services/api.js'
import PhotoUploader from '@/components/admin/PhotoUploader.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import AppButton from '@/components/common/AppButton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

usePageMeta('Profil')

const store = useProfileStore()
const toast = useToastStore()
const confirm = useConfirmStore()

const form = reactive({
  first_name: '',
  last_name: '',
  professional_title: '',
  short_bio: '',
  long_bio: '',
  location: '',
  website: '',
})
const errors = reactive({})
const serverError = ref(null)
const loaded = ref(false)

// Règles alignées sur UpdateProfileRequest (backend).
const rules = {
  first_name: [{ max: 100 }],
  last_name: [{ max: 100 }],
  professional_title: [{ max: 255 }],
  short_bio: [{ max: 500 }],
  long_bio: [{ max: 20000 }],
  location: [{ max: 255 }],
  website: [{ url: true }, { max: 255 }],
}

function fill(profile) {
  for (const key of Object.keys(form)) {
    form[key] = profile?.[key] ?? ''
  }
}

onMounted(async () => {
  try {
    const profile = await store.fetchAdmin()
    fill(profile)
    loaded.value = true
  } catch {
    /* ErrorState piloté par store.adminStatus */
  }
})

watch(
  () => store.adminProfile,
  (profile) => {
    if (profile && loaded.value) fill(profile)
  },
)

async function submit() {
  serverError.value = null
  Object.keys(errors).forEach((key) => delete errors[key])

  const localErrors = validate(form, rules)
  if (Object.keys(localErrors).length) {
    Object.assign(errors, localErrors)
    return
  }

  try {
    const payload = {}
    for (const key of Object.keys(form)) {
      payload[key] = form[key] === '' ? null : form[key]
    }
    const profile = await store.updateAdmin(payload)
    fill(profile)
    toast.success('Profil mis à jour.')
  } catch (error) {
    if (error instanceof ApiError && error.isValidation && error.errors) {
      Object.assign(errors, backendErrorsToMap(error.errors))
    } else {
      serverError.value = error
      toast.error(error?.message || 'Échec de la mise à jour.')
    }
  }
}

async function onUpload(file) {
  try {
    await store.uploadPhoto(file)
    toast.success('Photo de profil mise à jour.')
  } catch (error) {
    toast.error(error?.message || "Échec de l'envoi de la photo.")
  }
}

async function onRemovePhoto() {
  const ok = await confirm.confirm({
    title: 'Supprimer la photo',
    message: 'La photo de profil sera supprimée du serveur. Continuer ?',
    confirmLabel: 'Supprimer',
  })
  if (!ok) return
  try {
    await store.deletePhoto()
    toast.success('Photo supprimée.')
  } catch (error) {
    toast.error(error?.message || 'Échec de la suppression.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <ErrorState
      v-if="store.adminStatus === 'error'"
      :error="store.adminError"
      @retry="store.fetchAdmin(true).then((p) => fill(p)).catch(() => {})"
    />
    <LoadingState
      v-else-if="store.adminStatus === 'loading'"
      label="Chargement du profil…"
    />

    <template v-else-if="loaded">
      <PhotoUploader
        :image="store.adminProfile?.profile_image || null"
        :name="form.first_name || form.last_name || store.adminProfile?.full_name || ''"
        :saving="store.saving"
        @upload="onUpload"
        @remove="onRemovePhoto"
      />

      <form class="panel flex flex-col gap-6 p-6" novalidate @submit.prevent="submit">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-gold-deep">
          Informations personnelles
        </h2>

        <div
          v-if="serverError"
          class="rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {{ serverError.message }}
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <AppInput
            v-model="form.first_name"
            label="Prénom"
            name="first_name"
            autocomplete="given-name"
            :error="errors.first_name"
          />
          <AppInput
            v-model="form.last_name"
            label="Nom"
            name="last_name"
            autocomplete="family-name"
            :error="errors.last_name"
          />
          <AppInput
            v-model="form.professional_title"
            label="Titre professionnel"
            name="professional_title"
            :error="errors.professional_title"
            hint="Ex. : Développeur web & mobile"
            class="sm:col-span-2"
          />
          <AppInput
            v-model="form.location"
            label="Localisation"
            name="location"
            :error="errors.location"
            hint="Ville, pays — affiché publiquement."
          />
          <AppInput
            v-model="form.website"
            label="Site personnel"
            type="url"
            name="website"
            placeholder="https://…"
            :error="errors.website"
          />
        </div>

        <AppTextarea
          v-model="form.short_bio"
          label="Biographie courte"
          name="short_bio"
          :rows="3"
          :maxlength="500"
          :error="errors.short_bio"
          hint="Accroche du hero et du pied de page (500 caractères max)."
        />

        <AppTextarea
          v-model="form.long_bio"
          label="Biographie détaillée"
          name="long_bio"
          :rows="10"
          :maxlength="20000"
          :error="errors.long_bio"
          hint="Page « À propos » (jusqu'à 20 000 caractères)."
        />

        <div class="flex justify-end border-t border-line pt-4">
          <AppButton type="submit" :loading="store.saving">
            <Save class="size-4" aria-hidden="true" />
            Enregistrer les modifications
          </AppButton>
        </div>
      </form>
    </template>
  </div>
</template>

