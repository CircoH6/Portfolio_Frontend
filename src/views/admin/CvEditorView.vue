<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Save, FileDown, Monitor, Smartphone } from '@lucide/vue'
import { cvService } from '@/services/cv.service'
import { projectsService } from '@/services/projects.service'
import { skillsService } from '@/services/skills.service'
import { experiencesService } from '@/services/experiences.service'
import { educationsService } from '@/services/educations.service'
import { certificationsService } from '@/services/certifications.service'
import { profileService } from '@/services/profile.service'
import { useToastStore } from '@/stores/toast.store'
import { useConfirmStore } from '@/stores/confirm.store'
import { api } from '@/services/api.js'
import { ApiError } from '@/services/api.js'
import { backendErrorsToMap, validate } from '@/utils/validators'
import { normalizeCv, cvPdfFilename } from '@/utils/cv-data'
import { PROJECT_STATUS_LABELS, projectStatusTone } from '@/utils/project-status'
import { formatMonthYear } from '@/utils/dates'
import CvSheet from '@/components/cv/CvSheet.vue'
import CvOrderList from '@/components/admin/CvOrderList.vue'
import ToggleSwitch from '@/components/common/ToggleSwitch.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSelect from '@/components/common/AppSelect.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const confirmStore = useConfirmStore()
const id = Number(route.params.id)

const loading = ref(true)
const error = ref(null)
const saving = ref(false)
const downloading = ref(false)
const serverError = ref(null)
const mobileView = ref('settings') // 'settings' | 'preview' (mobile uniquement)

// Catalogues de données professionnelles (source unique partagée avec le site)
const allProjects = ref([])
const allSkills = ref([])
const allExperiences = ref([])
const allEducations = ref([])
const allCertifications = ref([])
const profile = ref(null)
const currentCv = ref(null)

const form = reactive({
  name: '',
  slug: '',
  template: 'default',
  language: 'fr',
  show_photo: true,
  show_phone: true,
  show_whatsapp: true,
  show_email: true,
  show_github: true,
  show_linkedin: true,
  show_location: true,
  is_public: true,
  is_default: false,
  project_ids: [],
  skill_ids: [],
  experience_ids: [],
  education_ids: [],
  certification_ids: [],
})

const formErrors = reactive({})
const rules = {
  name: [{ required: true }, { max: 150 }],
  slug: [{ max: 180 }],
}

const templateOptions = [
  { value: 'default', label: 'Par défaut (A4 monochrome professionnel)' },
]

const languageOptions = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
]

/* ---------------------- Sélections ordonnées ---------------------- */

function pick(catalog, idValue) {
  return catalog.value.find((item) => item.id === Number(idValue)) || null
}

const selectedProjects = computed(() => form.project_ids.map((v) => pick(allProjects, v)).filter(Boolean))
const selectedSkills = computed(() => form.skill_ids.map((v) => pick(allSkills, v)).filter(Boolean))
const selectedExperiences = computed(() => form.experience_ids.map((v) => pick(allExperiences, v)).filter(Boolean))
const selectedEducations = computed(() => form.education_ids.map((v) => pick(allEducations, v)).filter(Boolean))
const selectedCertifications = computed(() => form.certification_ids.map((v) => pick(allCertifications, v)).filter(Boolean))

const availableProjects = computed(() => allProjects.value.filter((p) => !form.project_ids.map(Number).includes(p.id)))
const availableSkills = computed(() => allSkills.value.filter((s) => !form.skill_ids.map(Number).includes(s.id)))
const availableExperiences = computed(() => allExperiences.value.filter((e) => !form.experience_ids.map(Number).includes(e.id)))
const availableEducations = computed(() => allEducations.value.filter((e) => !form.education_ids.map(Number).includes(e.id)))
const availableCertifications = computed(() => allCertifications.value.filter((c) => !form.certification_ids.map(Number).includes(c.id)))

/* ---------------------- Prévisualisation A4 ---------------------- */

/**
 * Reconstruit une CvProfileResource "live" depuis le formulaire + les
 * éléments sélectionnés (dans l'ordre courant), puis la normalise avec
 * `normalizeCv` (même pipeline que la page publique). L'aperçu reflète
 * donc fidèlement la future sortie PDF.
 */
const previewData = computed(() => {
  const liveResource = {
    name: form.name,
    slug: form.slug,
    template: form.template,
    language: form.language,
    options: {
      show_photo: form.show_photo,
      show_phone: form.show_phone,
      show_whatsapp: form.show_whatsapp,
      show_email: form.show_email,
      show_github: form.show_github,
      show_linkedin: form.show_linkedin,
      show_location: form.show_location,
    },
    profile: profile.value || {},
    projects: selectedProjects.value,
    skills: selectedSkills.value,
    experiences: selectedExperiences.value,
    educations: selectedEducations.value,
    certifications: selectedCertifications.value,
  }
  return normalizeCv(liveResource)
})

/* ---------------------- Chargement ---------------------- */

async function load() {
  loading.value = true
  error.value = null
  try {
    const [cv, prof, projects, skills, experiences, educations, certifications] = await Promise.all([
      cvService.admin.get(id),
      profileService.getAdmin().catch(() => null),
      projectsService.admin.list({ per_page: 100, visible: false }).catch(() => ({ projects: [] })),
      skillsService.admin.list({ per_page: 100 }).catch(() => []),
      experiencesService.admin.list({ per_page: 100 }).catch(() => []),
      educationsService.admin.list({ per_page: 100 }).catch(() => []),
      certificationsService.admin.list({ per_page: 100 }).catch(() => []),
    ])

    currentCv.value = cv
    profile.value = prof
    allProjects.value = projects.projects || projects || []
    allSkills.value = Array.isArray(skills) ? skills : skills.data || []
    allExperiences.value = Array.isArray(experiences) ? experiences : experiences.data || []
    allEducations.value = Array.isArray(educations) ? educations : educations.data || []
    allCertifications.value = Array.isArray(certifications) ? certifications : certifications.data || []

    // Pré-remplissage : l'ordre renvoyé reflète display_order des pivots.
    Object.assign(form, {
      name: cv.name || '',
      slug: cv.slug || '',
      template: cv.template || 'default',
      language: cv.language || 'fr',
      show_photo: cv.options?.show_photo ?? true,
      show_phone: cv.options?.show_phone ?? true,
      show_whatsapp: cv.options?.show_whatsapp ?? true,
      show_email: cv.options?.show_email ?? true,
      show_github: cv.options?.show_github ?? true,
      show_linkedin: cv.options?.show_linkedin ?? true,
      show_location: cv.options?.show_location ?? true,
      is_public: cv.is_public ?? true,
      is_default: cv.is_default ?? false,
      project_ids: (cv.projects || []).map((p) => p.id),
      skill_ids: (cv.skills || []).map((s) => s.id),
      experience_ids: (cv.experiences || []).map((e) => e.id),
      education_ids: (cv.educations || []).map((e) => e.id),
      certification_ids: (cv.certifications || []).map((c) => c.id),
    })
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
}

onMounted(load)

/* ---------------------- Actions de sélection ---------------------- */

function addTo(listName, itemId) {
  const list = form[listName]
  const num = Number(itemId)
  if (!list.includes(num)) list.push(num)
}

function removeFrom(listName, itemId) {
  const list = form[listName]
  const idx = list.findIndex((v) => Number(v) === Number(itemId))
  if (idx !== -1) list.splice(idx, 1)
}

/** Déplace un élément d'un cran (delta -1 / +1) dans sa liste ordonnée. */
function move(listName, itemId, delta) {
  const list = form[listName]
  const idx = list.findIndex((v) => Number(v) === Number(itemId))
  if (idx === -1) return
  const target = idx + delta
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(idx, 1)
  list.splice(target, 0, item)
}

/* ---------------------- Enregistrement ---------------------- */

function buildPayload() {
  const payload = {
    name: form.name,
    template: form.template,
    language: form.language,
    show_photo: form.show_photo,
    show_phone: form.show_phone,
    show_whatsapp: form.show_whatsapp,
    show_email: form.show_email,
    show_github: form.show_github,
    show_linkedin: form.show_linkedin,
    show_location: form.show_location,
    is_public: form.is_public,
    is_default: form.is_default,
    project_ids: form.project_ids.map(Number),
    skill_ids: form.skill_ids.map(Number),
    experience_ids: form.experience_ids.map(Number),
    education_ids: form.education_ids.map(Number),
    certification_ids: form.certification_ids.map(Number),
  }
  if (form.slug && form.slug.trim() !== '') payload.slug = form.slug.trim()
  return payload
}

async function save() {
  Object.keys(formErrors).forEach((k) => delete formErrors[k])
  serverError.value = null
  const local = validate(form, rules)
  if (Object.keys(local).length) {
    Object.assign(formErrors, local)
    return
  }
  saving.value = true
  try {
    await cvService.admin.update(id, buildPayload())
    toast.success('CV enregistré.')
  } catch (err) {
    if (err instanceof ApiError && err.isValidation && err.errors) {
      Object.assign(formErrors, backendErrorsToMap(err.errors))
    } else {
      serverError.value = err
    }
    toast.error(err?.message || "Échec de l'enregistrement.")
  } finally {
    saving.value = false
  }
}

/* ---------------------- Export PDF (backend DomPDF) ---------------------- */

async function download() {
  downloading.value = true
  try {
    const { blob, filename } = await cvService.downloadAdminPdf(id)
    api.saveBlob(blob, filename || cvPdfFilename(form.slug))
    toast.success('PDF téléchargé.')
  } catch (err) {
    toast.error(err?.message || 'Échec de la génération du PDF.')
  } finally {
    downloading.value = false
  }
}

function back() {
  router.push({ name: 'admin-cv-list' })
}

</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Barre d'actions -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <AppButton variant="ghost" @click="back">
          <ArrowLeft class="size-4" aria-hidden="true" />
          Retour
        </AppButton>
        <div>
          <h1 class="text-xl font-semibold text-paper">{{ form.name || 'CV' }}</h1>
          <p class="text-sm text-muted">
            Modèle {{ form.template }} · {{ form.language.toUpperCase() }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-3">
        <AppBadge :tone="form.is_public ? 'success' : 'neutral'">
          {{ form.is_public ? 'Public' : 'Privé' }}
        </AppBadge>
        <AppBadge v-if="form.is_default" tone="gold">Par défaut</AppBadge>
        <AppButton variant="secondary" :loading="downloading" @click="download">
          <FileDown class="size-4" aria-hidden="true" />
          Exporter en PDF
        </AppButton>
        <AppButton :loading="saving" @click="save">
          <Save class="size-4" aria-hidden="true" />
          Enregistrer
        </AppButton>
      </div>
    </div>

    <LoadingState v-if="loading" label="Chargement du CV…" />
    <ErrorState v-else-if="error" :error="error" @retry="load" />

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <!-- Bascule mobile réglages/aperçu -->
      <div class="flex gap-2 lg:hidden">
        <AppButton
          :variant="mobileView === 'settings' ? 'primary' : 'secondary'"
          size="sm"
          @click="mobileView = 'settings'"
        >
          <Smartphone class="size-4" aria-hidden="true" />
          Réglages
        </AppButton>
        <AppButton
          :variant="mobileView === 'preview' ? 'primary' : 'secondary'"
          size="sm"
          @click="mobileView = 'preview'"
        >
          <Monitor class="size-4" aria-hidden="true" />
          Aperçu
        </AppButton>
      </div>

      <!-- ===================== Panneau de configuration ===================== -->
      <section
        class="panel flex flex-col gap-6 p-5"
        :class="mobileView === 'preview' ? 'hidden lg:flex' : 'flex'"
        aria-label="Configuration du CV"
      >
        <div v-if="serverError" class="rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {{ serverError.message }}
        </div>

        <!-- Identité -->
        <div class="flex flex-col gap-4">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gold-deep">Identité</h2>
          <AppInput v-model="form.name" label="Nom de la version" name="name" required :error="formErrors.name" maxlength="150" />
          <AppInput v-model="form.slug" label="Slug" name="slug" :error="formErrors.slug" maxlength="180" hint="URL publique : /cv/{slug}" />
          <AppSelect v-model="form.language" label="Langue" name="language" :options="languageOptions" placeholder="" />
          <AppSelect v-model="form.template" label="Modèle" name="template" :options="templateOptions" placeholder="" />
        </div>

        <!-- Options d'affichage -->
        <div class="flex flex-col gap-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gold-deep">Éléments affichés</h2>
          <ToggleSwitch v-model="form.show_photo" label="Photo" />
          <ToggleSwitch v-model="form.show_phone" label="Téléphone" />
          <ToggleSwitch v-model="form.show_whatsapp" label="WhatsApp" />
          <ToggleSwitch v-model="form.show_email" label="E-mail" />
          <ToggleSwitch v-model="form.show_github" label="GitHub" />
          <ToggleSwitch v-model="form.show_linkedin" label="LinkedIn" />
          <ToggleSwitch v-model="form.show_location" label="Localisation" />
        </div>

        <!-- Statuts -->
        <div class="flex flex-col gap-3">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gold-deep">Statut</h2>
          <ToggleSwitch v-model="form.is_public" label="Public (accessible sur /cv/:slug)" />
          <ToggleSwitch v-model="form.is_default" label="CV par défaut" />
        </div>

        <!-- Contenu sélectionné et ordonné -->
        <div class="flex flex-col gap-5 border-t border-line pt-5">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gold-deep">Contenu du CV</h2>

          <CvOrderList
            title="Expériences professionnelles"
            :selected="selectedExperiences"
            :available="availableExperiences"
            :label-for="(e) => `${e.title || ''} — ${e.company || ''}`"
            :meta-for="(e) => formatMonthYear(e.start_date)"
            @add="addTo('experience_ids', $event)"
            @remove="removeFrom('experience_ids', $event)"
            @move="(itemId, delta) => move('experience_ids', itemId, delta)"
          />

          <CvOrderList
            title="Compétences"
            :selected="selectedSkills"
            :available="availableSkills"
            :label-for="(s) => s.name"
            :meta-for="(s) => s.category?.name || ''"
            @add="addTo('skill_ids', $event)"
            @remove="removeFrom('skill_ids', $event)"
            @move="(itemId, delta) => move('skill_ids', itemId, delta)"
          />

          <CvOrderList
            title="Projets"
            :selected="selectedProjects"
            :available="availableProjects"
            :label-for="(p) => p.title"
            :meta-for="(p) => PROJECT_STATUS_LABELS[p.status] || ''"
            @add="addTo('project_ids', $event)"
            @remove="removeFrom('project_ids', $event)"
            @move="(itemId, delta) => move('project_ids', itemId, delta)"
          />

          <CvOrderList
            title="Formations"
            :selected="selectedEducations"
            :available="availableEducations"
            :label-for="(e) => `${e.degree || ''} — ${e.institution || ''}`"
            :meta-for="(e) => formatMonthYear(e.start_date)"
            @add="addTo('education_ids', $event)"
            @remove="removeFrom('education_ids', $event)"
            @move="(itemId, delta) => move('education_ids', itemId, delta)"
          />

          <CvOrderList
            title="Certifications"
            :selected="selectedCertifications"
            :available="availableCertifications"
            :label-for="(c) => c.name"
            :meta-for="(c) => c.organization || ''"
            @add="addTo('certification_ids', $event)"
            @remove="removeFrom('certification_ids', $event)"
            @move="(itemId, delta) => move('certification_ids', itemId, delta)"
          />
        </div>
      </section>

      <!-- ===================== Panneau d'aperçu A4 ===================== -->
      <section
        class="flex flex-col gap-3"
        :class="mobileView === 'settings' ? 'hidden lg:flex' : 'flex'"
        aria-label="Prévisualisation du CV"
      >
        <p class="text-xs text-muted">
          Aperçu fidèle au format A4. Le PDF final est généré par le serveur lors de l'export.
        </p>
        <div class="flex justify-center overflow-x-auto rounded-xl border border-line bg-ink-2 p-4">
          <CvSheet v-if="previewData" :data="previewData" class="shadow-2xl" />
          <p v-else class="text-sm text-muted">Aucun contenu à prévisualiser.</p>
        </div>
      </section>
    </div>
  </div>
</template>

