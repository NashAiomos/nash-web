import { createHash } from 'node:crypto'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = fileURLToPath(new URL('../', import.meta.url))
const { images } = JSON.parse(await readFile(path.join(root, 'docs/image-sources.json'), 'utf8'))
const output = path.join(root, 'public/images/optimized')
await mkdir(output, { recursive: true })
const manifest = {}
for (const image of images) {
  const original = path.join(root, '.image-backup', image.object_key.replace(/^images\//, ''))
  let input
  try {
    input = await readFile(original)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    const response = await fetch(image.url)
    if (!response.ok) throw new Error(`Image download failed (${response.status}): ${image.url}`)
    input = Buffer.from(await response.arrayBuffer())
    await mkdir(path.dirname(original), { recursive: true })
    await writeFile(original, input)
  }
  if (createHash('sha256').update(input).digest('hex') !== image.sha256)
    throw new Error(`Checksum mismatch: ${image.url}`)

  const metadata = await sharp(input).metadata()
  if ((metadata.pages || 1) > 1) throw new Error(`Animated image needs a separate strategy: ${image.url}`)
  const dimensions = metadata.autoOrient || metadata
  const widths = [...new Set([480, 960, 1440].map(width => Math.min(width, dimensions.width)))]
  const variants = []
  for (const width of widths) {
    const filename = `${image.sha256.slice(0, 20)}-${width}.webp`
    const info = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(path.join(output, filename))
    variants.push({ src: `/images/optimized/${filename}`, width: info.width, bytes: info.size })
  }
  manifest[image.url] = { width: dimensions.width, height: dimensions.height, variants }
}
await writeFile(path.join(root, 'assets/data/image-variants.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Generated responsive WebP variants for ${images.length} images.`)
