<script setup>
import { ChevronUp, ChevronDown, X, Plus } from '@lucide/vue'

/**
 * Sélecteur ordonné réutilisable pour le constructeur de CV.
 * `selected` : éléments inclus (dans l'ordre courant).
 * `available` : éléments restants à ajouter.
 * Événements : add(id), remove(id), move(id, delta).
 */
defineProps({
  title: { type: String, required: true },
  selected: { type: Array, required: true },
  available: { type: Array, required: true },
  labelFor: { type: Function, required: true },
  metaFor: { type: Function, default: () => '' },
})
const emit = defineEmits(['add', 'remove', 'move'])
</script>

<template>
  <div class="flex flex-col gap-2">
    <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
      {{ title }} <span class="text-gold">({{ selected.length }})</span>
    </h3>

    <p v-if="!selected.length" class="text-xs italic text-muted">Aucun élément sélectionné.</p>
    <ol v-else class="flex flex-col gap-1.5">
      <li
        v-for="(item, index) in selected"
        :key="item.id"
        class="flex items-center gap-2 rounded-lg border border-line bg-ink-3 px-3 py-2"
      >
        <div class="flex flex-col">
          <button
            type="button"
            class="text-muted transition-colors hover:text-gold disabled:opacity-30"
            :disabled="index === 0"
            :aria-label="`Monter ${labelFor(item)}`"
            @click="emit('move', item.id, -1)"
          >
            <ChevronUp class="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="text-muted transition-colors hover:text-gold disabled:opacity-30"
            :disabled="index === selected.length - 1"
            :aria-label="`Descendre ${labelFor(item)}`"
            @click="emit('move', item.id, 1)"
          >
            <ChevronDown class="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm text-paper">{{ labelFor(item) }}</p>
          <p v-if="metaFor(item)" class="truncate text-xs text-muted">{{ metaFor(item) }}</p>
        </div>
        <button
          type="button"
          class="rounded p-1 text-muted transition-colors hover:text-danger"
          :aria-label="`Retirer ${labelFor(item)}`"
          @click="emit('remove', item.id)"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </li>
    </ol>

    <div v-if="available.length" class="flex flex-wrap gap-1.5">
      <button
        v-for="item in available"
        :key="item.id"
        type="button"
        class="inline-flex items-center gap-1 rounded-full border border-line-2 px-2.5 py-1 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
        @click="emit('add', item.id)"
      >
        <Plus class="size-3" aria-hidden="true" />
        {{ labelFor(item) }}
      </button>
    </div>
    <p v-else class="text-xs italic text-muted">Tout est inclus.</p>
  </div>
</template>
