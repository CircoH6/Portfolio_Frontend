<script setup>
/**
 * Feuille de CV au format A4 — reprend la STRUCTURE et la hiérarchie du
 * template backend `cv.default` (le PDF reste généré par Laravel/DomPDF ;
 * ce composant sert à la consultation publique et à l'aperçu admin).
 *
 * Props : une "CV Data" normalisée (utils/cv-data.js) :
 * { cv, profile, contact[], skills[], projects[], experiences[],
 *   educations[], certifications[] }
 */
const props = defineProps({
  data: { type: Object, required: true },
  /** Date du jour dans le pied de page (comme le PDF backend). */
  showFooterDate: { type: Boolean, default: true },
})

const generatedOn = new Date().toLocaleDateString('fr-FR')
</script>

<template>
  <article
    class="a4-sheet cv-sheet flex flex-col p-8 sm:p-10"
    :lang="data.cv?.language || 'fr'"
    aria-label="Aperçu du CV"
  >
    <!-- ===================== En-tête ===================== -->
    <header class="flex items-start gap-4 border-b-[3px] border-blue-700 pb-3">
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-gray-900">
          {{ data.profile.full_name }}
        </h1>
        <p v-if="data.profile.professional_title" class="mt-0.5 font-semibold text-blue-700">
          {{ data.profile.professional_title }}
        </p>
        <p v-if="data.profile.location" class="mt-1 text-[12.5px] text-gray-500">
          {{ data.profile.location }}
        </p>
        <p v-if="data.contact.length" class="mt-1.5 text-[12.5px] text-gray-700">
          {{ data.contact.map((c) => c.value).join(' · ') }}
        </p>
        <p v-if="data.profile.website" class="mt-0.5 break-all text-[12.5px] text-gray-700">
          {{ data.profile.website }}
        </p>
      </div>
      <img
        v-if="data.profile.photo_url"
        :src="data.profile.photo_url"
        alt="Photo du titulaire du CV"
        class="size-[84px] shrink-0 rounded-full object-cover"
      />
    </header>

    <!-- ===================== Profil ===================== -->
    <section
      v-if="data.profile.long_bio || data.profile.short_bio"
      class="mt-4"
      aria-label="Profil"
    >
      <h2 class="cv-heading">Profil</h2>
      <p class="text-[13px] leading-relaxed text-gray-600">
        {{ data.profile.long_bio || data.profile.short_bio }}
      </p>
    </section>

    <!-- ===================== Expériences ===================== -->
    <section v-if="data.experiences.length" class="mt-4" aria-label="Expérience professionnelle">
      <h2 class="cv-heading">Expérience professionnelle</h2>
      <div v-for="exp in data.experiences" :key="exp.id" class="mb-2.5">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3">
          <p class="font-bold text-gray-900">
            {{ exp.title }}
            <span class="font-normal italic text-gray-700">
              — {{ exp.company }}<span v-if="exp.location">, {{ exp.location }}</span>
            </span>
          </p>
          <p class="shrink-0 text-[12.5px] text-gray-500">
            {{ exp.start_date }}<template v-if="exp.end_date"> – {{ exp.end_date }}</template><template v-else-if="exp.is_current"> – aujourd'hui</template>
          </p>
        </div>
        <p
          v-if="exp.description"
          class="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-gray-600"
        >
          {{ exp.description }}
        </p>
      </div>
    </section>

    <!-- ===================== Compétences ===================== -->
    <section v-if="data.skills.length" class="mt-4" aria-label="Compétences">
      <h2 class="cv-heading">Compétences</h2>
      <div v-for="group in data.skills" :key="group.id ?? group.name" class="mb-1.5">
        <span class="font-bold text-gray-900">{{ group.name }}&#160;:</span>
        <span class="ml-1 inline-flex flex-wrap gap-1 align-middle">
          <span
            v-for="skill in group.items"
            :key="skill.id"
            class="inline-block rounded-full border border-blue-200 bg-blue-50 px-2 py-px text-[12.5px] text-blue-800"
          >
            {{ skill.name }}
          </span>
        </span>
      </div>
    </section>

    <!-- ===================== Projets ===================== -->
    <section v-if="data.projects.length" class="mt-4" aria-label="Projets">
      <h2 class="cv-heading">Projets</h2>
      <div v-for="project in data.projects" :key="project.id" class="mb-2.5">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3">
          <p class="font-bold text-gray-900">{{ project.title }}</p>
          <p class="shrink-0 text-[12.5px] text-gray-500">
            {{ project.start_date }}<template v-if="project.end_date"> – {{ project.end_date }}</template>
          </p>
        </div>
        <p v-if="project.role" class="italic text-gray-700">Rôle : {{ project.role }}</p>
        <p v-if="project.short_description" class="text-[13px] leading-relaxed text-gray-600">
          {{ project.short_description }}
        </p>
        <p v-if="project.technologies.length" class="text-[12px] text-gray-500">
          Technologies : {{ project.technologies.map((t) => t.name).join(', ') }}
        </p>
      </div>
    </section>

    <!-- ===================== Formations ===================== -->
    <section v-if="data.educations.length" class="mt-4" aria-label="Formation">
      <h2 class="cv-heading">Formation</h2>
      <div v-for="edu in data.educations" :key="edu.id" class="mb-2.5">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3">
          <p class="font-bold text-gray-900">
            {{ edu.degree }}<span v-if="edu.field"> — {{ edu.field }}</span>
            <span class="font-normal italic text-gray-700"> — {{ edu.institution }}</span>
          </p>
          <p class="shrink-0 text-[12.5px] text-gray-500">
            {{ edu.start_date }}<template v-if="edu.end_date"> – {{ edu.end_date }}</template><template v-else-if="edu.is_current"> – En cours</template>
          </p>
        </div>
        <p
          v-if="edu.description"
          class="mt-0.5 whitespace-pre-line text-[13px] leading-relaxed text-gray-600"
        >
          {{ edu.description }}
        </p>
      </div>
    </section>


    <!-- ===================== Certifications ===================== -->
    <section v-if="data.certifications.length" class="mt-4" aria-label="Certifications">
      <h2 class="cv-heading">Certifications</h2>
      <div v-for="cert in data.certifications" :key="cert.id" class="mb-2.5">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3">
          <p class="font-bold text-gray-900">
            {{ cert.name }}
            <span class="font-normal italic text-gray-700"> — {{ cert.organization }}</span>
          </p>
          <p class="shrink-0 text-[12.5px] text-gray-500">{{ cert.issue_date }}</p>
        </div>
        <a
          v-if="cert.credential_url"
          :href="cert.credential_url"
          target="_blank"
          rel="noopener noreferrer"
          class="break-all text-[12px] text-blue-700 underline"
        >
          {{ cert.credential_url }}
        </a>
      </div>
    </section>

    <!-- Aucune section sélectionnée -->
    <p
      v-if="
        !data.experiences.length &&
        !data.educations.length &&
        !data.projects.length &&
        !data.skills.length &&
        !data.certifications.length
      "
      class="mt-8 text-center text-[13px] text-gray-500"
    >
      Ce CV ne contient encore aucune section sélectionnée.
    </p>

    <!-- ===================== Pied de page ===================== -->
    <footer
      v-if="showFooterDate"
      class="mt-auto pt-6 text-center text-[11px] text-gray-400"
    >
      {{ data.cv.name }} — Généré le {{ generatedOn }}
    </footer>
  </article>
</template>

<style scoped>
.cv-heading {
  margin-bottom: 0.35rem;
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #1d4ed8;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 3px;
}
</style>

