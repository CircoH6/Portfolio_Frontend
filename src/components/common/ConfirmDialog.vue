<script setup>
import { storeToRefs } from 'pinia'
import { useConfirmStore } from '@/stores/confirm.store'
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'

const store = useConfirmStore()
const { pending } = storeToRefs(store)

function answer(value) {
  store.settle(value)
}
</script>

<template>
  <AppModal
    :open="Boolean(pending)"
    :title="pending?.title"
    size="sm"
    @close="answer(false)"
  >
    <p class="text-sm leading-relaxed text-muted">{{ pending?.message }}</p>
    <template #footer>
      <AppButton variant="ghost" @click="answer(false)">
        {{ pending?.cancelLabel || 'Annuler' }}
      </AppButton>
      <AppButton :variant="pending?.danger ? 'danger' : 'primary'" @click="answer(true)">
        {{ pending?.confirmLabel || 'Confirmer' }}
      </AppButton>
    </template>
  </AppModal>
</template>
