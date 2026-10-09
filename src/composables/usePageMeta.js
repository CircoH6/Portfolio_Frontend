import { watch, unref, isRef } from 'vue'

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Portfolio'

function setMetaContent(selector, content) {
  if (!content) return
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const [, attr, value] = selector.match(/^\[(.+?)="(.+?)"\]$/) || []
    if (attr) el.setAttribute(attr, value)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Titre + description de page (SEO de base côté SPA).
 * À appeler dans les vues ; les titres statiques viennent de route.meta.
 *
 * @param {string|import('vue').Ref<string>} title
 * @param {string|import('vue').Ref<string>} [description]
 */
export function usePageMeta(title, description) {
  const apply = () => {
    const t = unref(title)
    if (t) document.title = `${t} — ${APP_NAME}`
    if (description !== undefined) {
      setMetaContent('meta[name="description"]', unref(description))
      setMetaContent('meta[property="og:title"]', t)
      setMetaContent('meta[property="og:description"]', unref(description))
    }
  }

  const sources = []
  if (isRef(title)) sources.push(title)
  if (isRef(description)) sources.push(description)

  if (sources.length > 0) {
    watch(sources, apply, { immediate: true })
  } else {
    apply()
  }
}

export { APP_NAME }
