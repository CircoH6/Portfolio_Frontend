<script setup>
import { RouterView } from 'vue-router'
import SiteHeader from '@/components/portfolio/SiteHeader.vue'
import SiteFooter from '@/components/portfolio/SiteFooter.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-ink">
    <a
      href="#main-content"
      class="sr-only z-[70] rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Aller au contenu principal
    </a>
    <SiteHeader />
    <main id="main-content" class="flex-1">
      <RouterView />
    </main>
    <SiteFooter />
  </div>
</template>
