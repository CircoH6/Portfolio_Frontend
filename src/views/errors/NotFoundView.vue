<script setup>
import { RouterLink } from 'vue-router'
import { Compass } from '@lucide/vue'
import { usePageMeta } from '@/composables/usePageMeta'
import AppButton from '@/components/common/AppButton.vue'

usePageMeta('Page introuvable')
</script>

<template>
  <div class="container-page flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
    <div class="flex size-16 items-center justify-center rounded-full border border-line-2 text-gold">
      <Compass class="size-7" aria-hidden="true" />
    </div>
    <p class="font-serif text-7xl text-gold/30" aria-hidden="true">404</p>
    <h1 class="text-2xl font-semibold text-paper md:text-3xl">Page introuvable</h1>
    <p class="max-w-md text-sm leading-relaxed text-muted">
      La page demandée n'existe pas ou a été déplacée.
    </p>
    <div class="flex flex-wrap justify-center gap-3">
      <AppButton to="/">Retour à l'accueil</AppButton>
      <AppButton to="/projets" variant="secondary">Voir les projets</AppButton>
    </div>
  </div>
</template>
