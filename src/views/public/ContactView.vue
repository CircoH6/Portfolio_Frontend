<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { Send, CheckCircle2 } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile.store'
import { usePageMeta } from '@/composables/usePageMeta'
import { contactService } from '@/services/contact.service'
import { validate, backendErrorsToMap } from '@/utils/validators'
import { ApiError } from '@/services/api.js'
import SectionHeading from '@/components/portfolio/SectionHeading.vue'
import ContactMethods from '@/components/portfolio/ContactMethods.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import AppButton from '@/components/common/AppButton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

usePageMeta('Contact', 'Formulaire de contact et coordonnées publiques.')

const profileStore = useProfileStore()
const { publicProfile: profile, publicStatus, publicError } = storeToRefs(profileStore)

onMounted(() => profileStore.fetchPublic().catch(() => {}))

const form = reactive({ name: '', email: '', subject: '', message: '' })
const errors = reactive({})
const submitting = ref(false)
const submitted = ref(false)
const serverError = ref(null) // ApiError

// Règles alignées sur StoreContactMessageRequest (backend Laravel).
const rules = {
  name: [{ required: true }, { max: 255 }],
  email: [{ required: true }, { email: true }, { max: 255 }],
  subject: [{ required: true }, { max: 255 }],
  message: [{ required: true }, { min: 10, max: 5000 }],
}

const messageCount = computed(() => form.message.length)

async function submit() {
  serverError.value = null
  Object.keys(errors).forEach((key) => delete errors[key])

  const localErrors = validate(form, rules)
  if (Object.keys(localErrors).length) {
    Object.assign(errors, localErrors)
    document.querySelector('[aria-invalid="true"]')?.focus()
    return
  }

  submitting.value = true
  try {
    await contactService.send({ ...form })
    submitted.value = true
  } catch (error) {
    if (error instanceof ApiError && error.isValidation && error.errors) {
      Object.assign(errors, backendErrorsToMap(error.errors))
    } else {
      serverError.value = error
    }
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.name = ''
  form.email = ''
  form.subject = ''
  form.message = ''
  submitted.value = false
}
</script>

<template>
  <div class="container-page py-14 md:py-20">
    <SectionHeading
      eyebrow="Contact"
      title="Prenons contact"
      description="Décrivez votre besoin — le message part directement vers l'administration."
    />

    <div class="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
      <!-- Formulaire -->
      <section class="panel p-6 md:p-8" aria-labelledby="form-heading">
        <h2 id="form-heading" class="mb-6 text-lg font-semibold text-paper">
          Envoyer un message
        </h2>

        <!-- Confirmation après envoi -->
        <div
          v-if="submitted"
          class="flex flex-col items-start gap-4 rounded-xl border border-success/40 bg-success/5 p-6"
          role="status"
        >
          <CheckCircle2 class="size-7 text-success" aria-hidden="true" />
          <div>
            <p class="font-semibold text-paper">Message envoyé.</p>
            <p class="mt-1 text-sm text-muted">
              Votre message a été transmis et sera consulté.
            </p>
          </div>
          <AppButton variant="secondary" @click="resetForm">
            Envoyer un autre message
          </AppButton>
        </div>

        <form v-else class="flex flex-col gap-5" novalidate @submit.prevent="submit">
          <ErrorState
            v-if="serverError"
            :error="serverError"
            title="Échec de l'envoi"
            :retryable="false"
          />

          <div class="grid gap-5 sm:grid-cols-2">
            <AppInput
              v-model="form.name"
              label="Nom"
              name="name"
              autocomplete="name"
              required
              :error="errors.name"
            />
            <AppInput
              v-model="form.email"
              label="Adresse e-mail"
              type="email"
              name="email"
              autocomplete="email"
              required
              :error="errors.email"
            />
          </div>

          <AppInput
            v-model="form.subject"
            label="Sujet"
            name="subject"
            required
            :error="errors.subject"
          />

          <AppTextarea
            v-model="form.message"
            label="Message"
            name="message"
            :rows="7"
            :maxlength="5000"
            placeholder="Décrivez votre projet ou votre besoin (10 caractères minimum)."
            required
            :error="errors.message"
            :hint="!errors.message ? `${messageCount}/5000 caractères` : ''"
          />

          <div class="flex flex-wrap items-center justify-between gap-4">
            <p class="text-xs text-muted">
              Les champs marqués <span class="text-gold">*</span> sont obligatoires.
            </p>
            <AppButton type="submit" :loading="submitting">
              <Send class="size-4" aria-hidden="true" />
              {{ submitting ? 'Envoi en cours…' : 'Envoyer le message' }}
            </AppButton>
          </div>
        </form>
      </section>


      <!-- Coordonnées publiques -->
      <aside class="flex flex-col gap-6" aria-labelledby="direct-heading">
        <div class="panel p-6">
          <h2
            id="direct-heading"
            class="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-deep"
          >
            Contact direct
          </h2>
          <LoadingState v-if="publicStatus === 'loading'" compact />
          <ErrorState
            v-else-if="publicStatus === 'error'"
            :error="publicError"
            @retry="profileStore.fetchPublic(true).catch(() => {})"
          />
          <ContactMethods v-else :methods="profile?.contact_methods || []" />
        </div>

        <div v-if="profile?.location" class="panel p-6 text-sm text-muted">
          <p class="mb-1 font-semibold uppercase tracking-wider text-gold-deep">
            Localisation
          </p>
          <p>{{ profile.location }}</p>
        </div>
      </aside>
    </div>
  </div>
</template>

