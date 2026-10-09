import { ref, unref } from 'vue'
import { ApiError } from '@/services/api.js'

/**
 * Exécution asynchrone avec états loading / succès / erreur.
 * Aucun contenu de remplacement n'est substitué en cas d'erreur.
 *
 * @param {(…args:any[]) => Promise<any>} fn
 * @param {{immediate?: boolean, initial?: any}} [options]
 */
export function useAsync(fn, { immediate = true, initial = null } = {}) {
  const data = ref(initial)
  const loading = ref(false)
  const error = ref(null) // ApiError | null

  async function run(...args) {
    loading.value = true
    error.value = null
    try {
      data.value = await fn(...args)
      return data.value
    } catch (err) {
      error.value = err instanceof ApiError ? err : toApiLike(err)
      return undefined
    } finally {
      loading.value = false
    }
  }

  if (immediate) run()

  const reload = () => run()

  return { data, loading, error, run, reload }
}

function toApiLike(err) {
  return new ApiError({
    status: 0,
    message: err?.message || 'Une erreur inattendue est survenue.',
  })
}
