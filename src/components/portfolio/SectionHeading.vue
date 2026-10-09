<script setup>
/** En-tête de section : sur-titre discret, titre affirmé, filet doré. */
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  align: { type: String, default: 'left' }, // left | center
})
</script>

<template>
  <header
    class="mb-8 flex flex-col gap-3 md:mb-12"
    :class="align === 'center' ? 'items-center text-center' : ''"
  >
    <p
      v-if="eyebrow"
      class="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep"
    >
      {{ eyebrow }}
    </p>
    <h2 class="max-w-2xl text-2xl font-semibold text-paper md:text-3xl">
      {{ title }}
    </h2>
    <div class="rule-gold w-24" aria-hidden="true" />
    <p v-if="description" class="max-w-2xl text-sm leading-relaxed text-muted md:text-base">
      {{ description }}
    </p>
    <slot />
  </header>
</template>
