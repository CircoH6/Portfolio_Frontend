// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

/**
 * Garde-fou d'encodage.
 *
 * Trois vues admin ont été livrées avec du texte corrompu (double encodage
 * « Ã© », « Â« » et caractères de remplacement U+FFFD) plus un BOM UTF-8 :
 * « Chargement… » s'affichait « Chargement?? », « Échec » en « ?chec »,
 * « Supprimer « x » » en « Supprimer Â« x Â» ». Ces tests verrouillent
 * l'encodage du code source pour que la régression ne revienne pas.
 */

const ROOT = resolve(process.cwd(), 'src')

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(vue|js|css)$/.test(entry)) out.push(full)
  }
  return out
}

const FILES = walk(ROOT).map((f) => ({ path: relative(ROOT, f), file: f }))

/** Signatures de double encodage UTF-8 → Latin-1 → UTF-8. */
const MOJIBAKE = ['Ã©', 'Ã¨', 'Ã ', 'Ã§', 'Ãª', 'Ã®', 'Ã´', 'Ã»', 'Ã¹', 'â€', 'Â«', 'Â»', 'ï¿½']

describe('encodage des fichiers source', () => {
  it('couvre bien l’ensemble des sources', () => {
    expect(FILES.length).toBeGreaterThan(50)
  })

  it('aucun fichier ne contient de BOM UTF-8', () => {
    const withBom = FILES.filter(({ file }) =>
      readFileSync(file).subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
    ).map(({ path }) => path)

    expect(withBom).toEqual([])
  })

  it('aucun fichier ne contient de caractère de remplacement U+FFFD', () => {
    const broken = FILES.filter(({ file }) =>
      readFileSync(file, 'utf8').includes('\uFFFD'),
    ).map(({ path }) => path)

    expect(broken).toEqual([])
  })

  it('aucun fichier ne contient de séquence de double encodage', () => {
    const offenders = []

    for (const { path, file } of FILES) {
      const text = readFileSync(file, 'utf8')
      const found = MOJIBAKE.filter((sig) => text.includes(sig))
      if (found.length) offenders.push(`${path} → ${found.join(', ')}`)
    }

    expect(offenders).toEqual([])
  })

  it('les libellés corrigés sont bien en place', () => {
    const messages = readFileSync(join(ROOT, 'views/admin/MessagesView.vue'), 'utf8')
    const projects = readFileSync(join(ROOT, 'views/admin/ProjectsView.vue'), 'utf8')
    const cvs = readFileSync(join(ROOT, 'views/admin/CvListView.vue'), 'utf8')

    expect(messages).toContain("label=\"Chargement…\"")
    expect(messages).toContain("'Échec de la suppression.'")
    expect(messages).toContain("|| '—'")
    expect(projects).toContain("label=\"Chargement…\"")
    expect(projects).toContain('Supprimer « ${item.title} »')
    expect(projects).toContain('Projets affichés sur le site public')
    expect(cvs).toContain("'CV créé. Configurez-le maintenant.'")
    expect(cvs).toContain('Supprimer « ${item.name} »')
    expect(cvs).toContain("'Échec de la suppression.'")
  })
})
