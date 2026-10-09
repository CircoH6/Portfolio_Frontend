<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogIn, ShieldCheck } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.store'
import { useToastStore } from '@/stores/toast.store'
import { usePageMeta } from '@/composables/usePageMeta'
import { validate, backendErrorsToMap } from '@/utils/validators'
import { ApiError } from '@/services/api.js'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

usePageMeta('Connexion')

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const form = reactive({ email: '', password: '' })
const errors = reactive({})
const serverError = ref(null)

const rules = {
  email: [{ required: true }, { email: true }],
  password: [{ required: true }],
}

const redirectTarget = computed(
  () => (route.query.redirect && String(route.query.redirect)) || '/admin/dashboard',
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
    await auth.login(form.email, form.password)
    // Le mot de passe n'est jamais conservé côté navigateur.
    form.password = ''
    toast.success('Connexion réussie.')
    router.push(redirectTarget.value)
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.isValidation && error.errors) {
        Object.assign(errors, backendErrorsToMap(error.errors))
      } else {
        serverError.value = error
      }
    } else {
      serverError.value = new ApiError({ status: 0, message: 'Échec de la connexion.' })
    }
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
    <main class="w-full max-w-md">
      <div class="panel p-8 md:p-10">
        <div class="mb-8 flex flex-col items-center gap-3 text-center">
          <span class="flex size-12 items-center justify-center rounded-full border border-gold/50 text-gold">
            <ShieldCheck class="size-6" aria-hidden="true" />
          </span>
          <h1 class="text-xl font-semibold text-paper">Espace administration</h1>
          <p class="text-sm text-muted">
            Identifiez-vous pour gérer le portfolio et les CV.
          </p>
        </div>

        <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
          <div
            v-if="serverError"
            class="rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {{ serverError.message }}
          </div>

          <AppInput
            v-model="form.email"
            label="Adresse e-mail"
            type="email"
            name="email"
            autocomplete="username"
            placeholder="admin@example.com"
            required
            :error="errors.email"
          />
          <AppInput
            v-model="form.password"
            label="Mot de passe"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            :error="errors.password"
          />

          <AppButton type="submit" :loading="auth.loginLoading" block size="lg">
            <LogIn class="size-4" aria-hidden="true" />
            Se connecter
          </AppButton>
        </form>

        <p class="mt-6 text-center text-xs text-muted">
          Le jeton de session est le seul élément conservé — aucun mot de passe
          n'est stocké dans le navigateur.
        </p>
      </div>
    </main>
  </div>
</template>
