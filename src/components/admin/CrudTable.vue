<script setup>
/**
 * Tableau responsive — table sur grand écran, cartes sur mobile.
 * Colonnes : [{ key, label, align?, hideOnMobile? }]
 * Slots : `cell-<key>` (contenu de cellule) et `actions` (colonnes d'actions).
 */
defineProps({
  items: { type: Array, default: () => [] },
  columns: { type: Array, required: true },
  emptyLabel: { type: String, default: 'Aucun élément.' },
  rowKey: { type: String, default: 'id' },
})
</script>

<template>
  <!-- ===================== Bureau : tableau ===================== -->
  <div class="panel hidden overflow-hidden md:block">
    <table class="w-full text-left text-sm">
      <thead class="border-b border-line bg-ink-3">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted"
            :class="col.align === 'right' ? 'text-right' : ''"
          >
            {{ col.label }}
          </th>
          <th v-if="$slots.actions" scope="col" class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-line">
        <tr v-for="item in items" :key="item[rowKey]" class="transition-colors hover:bg-ink-3/60">
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 align-top text-paper"
            :class="[col.align === 'right' ? 'text-right' : '', col.class || '']"
          >
            <slot :name="`cell-${col.key}`" :item="item">
              {{ item[col.key] ?? '—' }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="px-4 py-3 text-right align-top">
            <div class="flex justify-end gap-1.5">
              <slot name="actions" :item="item" />
            </div>
          </td>
        </tr>
        <tr v-if="items.length === 0">
          <td
            :colspan="columns.length + ($slots.actions ? 1 : 0)"
            class="px-4 py-10 text-center text-muted"
          >
            {{ emptyLabel }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ===================== Mobile : cartes ===================== -->
  <div class="flex flex-col gap-3 md:hidden">
    <article
      v-for="item in items"
      :key="item[rowKey]"
      class="panel p-4"
    >
      <dl class="flex flex-col gap-2 text-sm">
        <div
          v-for="col in columns"
          :key="col.key"
          class="flex items-start justify-between gap-3"
        >
          <dt class="shrink-0 text-xs uppercase tracking-wide text-muted">
            {{ col.label }}
          </dt>
          <dd class="min-w-0 break-words text-right text-paper">
            <slot :name="`cell-${col.key}`" :item="item">
              {{ item[col.key] ?? '—' }}
            </slot>
          </dd>
        </div>
      </dl>
      <div v-if="$slots.actions" class="mt-3 flex flex-wrap justify-end gap-2 border-t border-line pt-3">
        <slot name="actions" :item="item" />
      </div>
    </article>
    <p v-if="items.length === 0" class="panel px-4 py-10 text-center text-sm text-muted">
      {{ emptyLabel }}
    </p>
  </div>
</template>
