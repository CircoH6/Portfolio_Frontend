<script setup>
import { computed, onMounted } from 'vue'
import CrudPageView from '@/components/admin/CrudPageView.vue'
import { skillsService } from '@/services/skills.service'
import { useCrud } from '@/composables/useCrud'

/* --- Catégories --- */
const categoryService = skillsService.categories
const categoryColumns = [
  { key: 'name', label: 'Catégorie' },
  { key: 'display_order', label: 'Ordre', align: 'right' },
]
const categoryFields = [
  { key: 'name', label: 'Nom de la catégorie', type: 'text', required: true, maxlength: 100 },
  {
    key: 'is_visible',
    label: 'Visible publiquement',
    type: 'toggle',
    hint: "L'API ne renvoie pas l'état actuel : cette valeur remplacera le réglage existant à l'enregistrement.",
  },
  { key: 'display_order', label: 'Ordre d\'affichage', type: 'number', hint: 'Plus bas = affiché en premier.' },
  { key: 'description', label: 'Description', type: 'textarea', rows: 3, maxlength: 500 },
]
const categoryRules = {
  name: [{ required: true }, { max: 100 }],
  description: [{ max: 500 }],
}

/* --- Compétences --- */
const categoriesCrud = useCrud(categoryService)
onMounted(() => categoriesCrud.load().catch(() => {}))

const categoryOptions = computed(() =>
  categoriesCrud.items.value.map((c) => ({ value: c.id, label: c.name })),
)

const skillColumns = [
  { key: 'name', label: 'Compétence' },
  { key: 'category', label: 'Catégorie' },
  { key: 'display_order', label: 'Ordre', align: 'right' },
]

const skillFields = computed(() => [
  {
    key: 'skill_category_id',
    label: 'Catégorie',
    type: 'select',
    required: true,
    options: categoryOptions.value,
    placeholder: categoryOptions.value.length ? '— Choisir —' : 'Créez d\'abord une catégorie',
  },
  { key: 'name', label: 'Nom', type: 'text', required: true, maxlength: 100 },
  {
    key: 'icon',
    label: 'Icône (URL)',
    type: 'text',
    maxlength: 255,
    placeholder: 'https://… ou /icons/react.svg',
    hint: 'Optionnel — URL d\'image (SVG/PNG) affichée à côté du nom.',
  },
  {
    key: 'is_visible',
    label: 'Visible publiquement',
    type: 'toggle',
    hint: "L'API ne renvoie pas l'état actuel : cette valeur remplacera le réglage existant à l'enregistrement.",
  },
  { key: 'display_order', label: 'Ordre d\'affichage', type: 'number', hint: 'Plus bas = affiché en premier.' },
  { key: 'description', label: 'Précision', type: 'textarea', rows: 3, maxlength: 500 },
])

const skillRules = {
  skill_category_id: [{ required: true }],
  name: [{ required: true }, { max: 100 }],
  icon: [{ url: true }, { max: 255 }],
  description: [{ max: 500 }],
}
</script>

<template>
  <div class="flex flex-col gap-12">
    <section aria-labelledby="skills-section">
      <div class="mb-5">
        <h2 id="skills-section" class="text-lg font-semibold text-paper">
          Compétences
        </h2>
        <p class="mt-1 text-sm text-muted">
          Chaque compétence est rattachée à une catégorie et dispose de son
          propre ordre d'affichage.
        </p>
      </div>
      <CrudPageView
        title="Compétences"
        :service="skillsService.admin"
        :columns="skillColumns"
        :fields="skillFields"
        :rules="skillRules"
        empty-label="Aucune compétence — créez d'abord une catégorie ci-dessous."
        create-label="Ajouter une compétence"
      >
        <template #cell-name="{ item }">
          <span class="font-medium">{{ item.name }}</span>
          <img
            v-if="item.icon && /^(https?:|\/|data:)/.test(item.icon)"
            :src="item.icon"
            alt=""
            class="ml-2 inline-block size-4 object-contain align-middle"
            loading="lazy"
          />
        </template>
        <template #cell-category="{ item }">
          <span class="text-sm text-muted">
            {{ item.category?.name || '—' }}
          </span>
        </template>
      </CrudPageView>
    </section>

    <hr class="rule-gold" />

    <section aria-labelledby="categories-section">
      <div class="mb-5">
        <h2 id="categories-section" class="text-lg font-semibold text-paper">
          Catégories
        </h2>
        <p class="mt-1 text-sm text-muted">
          Regroupements utilisés sur la page publique « Compétences ».
        </p>
      </div>
      <CrudPageView
        title="Catégories"
        :service="categoryService"
        :columns="categoryColumns"
        :fields="categoryFields"
        :rules="categoryRules"
        empty-label="Aucune catégorie."
        create-label="Ajouter une catégorie"
      >
        <template #cell-name="{ item }">
          <span class="font-medium">{{ item.name }}</span>
          <span class="ml-2 text-xs text-muted">
            {{ Array.isArray(item.skills) ? `${item.skills.length} compétence(s)` : '' }}
          </span>
        </template>
      </CrudPageView>
    </section>
  </div>
</template>
