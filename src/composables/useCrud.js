import { ref } from 'vue'

/**
 * Cycle de vie CRUD standard pour les services du backend.
 * Gère les deux formes de réponses listes du backend :
 * - tableau brut (apiResource)
 * - objet paginé { projects|messages, pagination, … }
 *
 * @param {{list:Function, create:Function, update:Function, remove:Function}} service
 */
export function useCrud(service) {
  const items = ref([])
  const pagination = ref(null)
  const extra = ref(null) // ex. unread_count pour les messages
  const loading = ref(false)
  const saving = ref(false)
  const error = ref(null)

  async function load(params = {}) {
    loading.value = true
    error.value = null
    try {
      const data = await service.list(params)
      if (Array.isArray(data)) {
        items.value = data
        pagination.value = null
        extra.value = null
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.projects)) items.value = data.projects
        else if (Array.isArray(data.messages)) items.value = data.messages
        else if (Array.isArray(data.data)) items.value = data.data
        pagination.value = data.pagination || null
        extra.value = typeof data.unread_count === 'number' ? data.unread_count : null
      }
      return items.value
    } catch (err) {
      error.value = err
      items.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  /** @returns {Promise<object>} élément créé ou mis à jour */
  async function save(payload, id = null) {
    saving.value = true
    try {
      const result = id ? await service.update(id, payload) : await service.create(payload)
      return result
    } finally {
      saving.value = false
    }
  }

  async function remove(id) {
    saving.value = true
    try {
      await service.remove(id)
    } finally {
      saving.value = false
    }
  }

  return { items, pagination, extra, loading, saving, error, load, save, remove }
}
