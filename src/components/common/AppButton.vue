<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Loader2 } from '@lucide/vue'

/**
 * Bouton unifié — variantes primaire (doré), secondaire, fantôme, danger.
 * `to` = navigation interne (RouterLink), `href` = lien externe/interrupteur
 * de page.
 */
const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger
  size: { type: String, default: 'md' }, // sm | md | lg
  type: { type: String, default: 'button' },
  to: { type: [String, Object], default: null },
  href: { type: String, default: null },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
})

const classes = computed(() => {
  const base = [
    'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed select-none',
    {
      sm: 'text-sm px-3 py-1.5 rounded-lg',
      md: 'text-sm px-4 py-2.5 rounded-lg',
      lg: 'text-base px-6 py-3 rounded-xl',
    }[props.size],
    props.block ? 'w-full' : '',
  ]

  const variants = {
    primary: 'bg-gold text-ink hover:bg-[#d4bd8d] active:bg-gold-deep',
    secondary: 'border border-line-2 text-paper hover:border-gold hover:text-gold',
    ghost: 'text-muted hover:text-paper hover:bg-ink-3',
    danger: 'border border-danger/50 text-danger hover:bg-danger/10',
  }

  base.push(variants[props.variant] || variants.primary)
  return base
})

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <RouterLink
    v-if="to && !isDisabled"
    :to="to"
    :class="classes"
    :aria-label="ariaLabel"
  >
    <slot />
  </RouterLink>
  <a
    v-else-if="href && !isDisabled"
    :href="href"
    :class="classes"
    :aria-label="ariaLabel"
    :target="href.startsWith('http') ? '_blank' : undefined"
    :rel="href.startsWith('http') ? 'noopener noreferrer' : undefined"
  >
    <slot />
  </a>
  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="isDisabled"
    :aria-label="ariaLabel"
    :aria-busy="loading || undefined"
  >
    <Loader2 v-if="loading" class="size-4 animate-spin" aria-hidden="true" />
    <slot />
  </button>
</template>
