<script setup>
import { formatDateRange } from '@/utils/dates'

/**
 * Chronologie verticale — expériences ou formations.
 * Dates, descriptions et statuts proviennent de l'API (aucune invention).
 */
const props = defineProps({
  items: { type: Array, default: () => [] },
  mode: { type: String, default: 'experience' }, // experience | education
})

function range(item) {
  if (props.mode === 'education') {
    return formatDateRange(
      { start: item.start_date, end: item.end_date, current: item.is_current },
      { short: true },
    )
  }
  return formatDateRange({
    start: item.start_date,
    end: item.end_date,
    current: item.is_current,
  })
}
</script>

<template>
  <ol class="relative flex flex-col gap-8 border-l border-line-2 pl-6 md:gap-10 md:pl-8">
    <li v-for="item in items" :key="item.id" class="relative">
      <!-- Pastille -->
      <span
        class="absolute -left-[1.93rem] top-1.5 flex size-3 items-center justify-center rounded-full border border-gold bg-ink md:-left-[2.43rem]"
        aria-hidden="true"
      >
        <span class="size-1 rounded-full bg-gold" />
      </span>

      <div class="panel p-5 transition-colors duration-300 hover:border-gold/40">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h3 class="text-base font-semibold text-paper md:text-lg">
            <template v-if="mode === 'education'">
              {{ item.degree }}<span v-if="item.field"> — {{ item.field }}</span>
            </template>
            <template v-else>{{ item.title }}</template>
          </h3>
          <p class="shrink-0 text-sm text-gold">
            {{ range(item) }}
          </p>
        </div>

        <p class="mt-1 text-sm text-muted">
          <template v-if="mode === 'education'">{{ item.institution }}</template>
          <template v-else>
            {{ item.company }}<span v-if="item.location"> · {{ item.location }}</span>
          </template>
        </p>

        <p
          v-if="item.description"
          class="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted"
        >
          {{ item.description }}
        </p>
      </div>
    </li>
  </ol>
</template>
