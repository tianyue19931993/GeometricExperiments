import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const outputDirectory = path.join(projectRoot, 'dist-html')
const outputFile = path.join(outputDirectory, '几何探索实验室.html')
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'geometric-lab-html-'))

function localAssetPath(reference) {
  const withoutQuery = reference.split(/[?#]/, 1)[0]
  return path.join(temporaryDirectory, decodeURIComponent(withoutQuery.replace(/^\.\//, '')))
}

try {
  await build({
    configFile: path.join(projectRoot, 'vite.config.ts'),
    build: {
      outDir: temporaryDirectory,
      emptyOutDir: true,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    },
  })

  let html = await readFile(path.join(temporaryDirectory, 'index.html'), 'utf8')

  html = await replaceAsync(
    html,
    /<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi,
    async (_match, before, source, after) => {
      const javascript = await readFile(localAssetPath(source), 'utf8')
      return `<script${before}${after}>${javascript.replace(/<\/script/gi, '<\\/script')}</script>`
    },
  )

  html = await replaceAsync(
    html,
    /<link\b([^>]*?)\brel=["']stylesheet["']([^>]*?)\bhref=["']([^"']+)["']([^>]*)>/gi,
    async (_match, before, middle, source) => {
      const css = await readFile(localAssetPath(source), 'utf8')
      return `<style${before}${middle}>${css.replace(/<\/style/gi, '<\\/style')}</style>`
    },
  )

  html = await replaceAsync(
    html,
    /<link\b([^>]*?)\brel=["']icon["']([^>]*?)\bhref=["']([^"']+)["']([^>]*)>/gi,
    async (_match, before, middle, source, after) => {
      const icon = await readFile(localAssetPath(source))
      const dataUri = `data:image/svg+xml;base64,${icon.toString('base64')}`
      return `<link${before}rel="icon"${middle}href="${dataUri}"${after}>`
    },
  )

  const htmlTagsOnly = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  const remainingLocalReferences = [...htmlTagsOnly.matchAll(/\b(?:src|href)=["'](?!data:|#|https?:|mailto:|tel:)([^"']+)["']/gi)]
  if (remainingLocalReferences.length > 0) {
    const references = remainingLocalReferences.map((match) => match[1]).join(', ')
    throw new Error(`Single-file build still contains local references: ${references}`)
  }

  await rm(outputDirectory, { recursive: true, force: true })
  await mkdir(outputDirectory, { recursive: true })
  await writeFile(outputFile, html)

  const sizeInMiB = Buffer.byteLength(html) / 1024 / 1024
  console.log(`Created ${path.relative(projectRoot, outputFile)} (${sizeInMiB.toFixed(2)} MiB)`)
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}

async function replaceAsync(source, pattern, replacer) {
  const matches = [...source.matchAll(pattern)]
  const replacements = await Promise.all(matches.map((match) => replacer(...match)))
  let result = source
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index]
    result = `${result.slice(0, match.index)}${replacements[index]}${result.slice(match.index + match[0].length)}`
  }
  return result
}
