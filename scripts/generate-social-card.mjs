import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#faf9f6"/>
  <path d="M80 76h1040" stroke="#d3d0c8"/>
  <circle cx="1090" cy="76" r="7" fill="#4d7768"/>
  <text x="80" y="240" font-family="Helvetica,Arial,sans-serif" font-size="86" font-weight="700" fill="#222820">Nash Aiomos</text>
  <text x="84" y="315" font-family="Helvetica,Arial,sans-serif" font-size="36" fill="#565d54">Software engineer &amp; writer</text>
  <text x="84" y="408" font-family="Helvetica,Arial,sans-serif" font-size="27" fill="#4d7768">Web3 · Blockchain · Metaverse · AI</text>
  <path d="M80 496h1040" stroke="#d3d0c8"/>
  <text x="84" y="550" font-family="Helvetica,Arial,sans-serif" font-size="24" fill="#777b74">nashaiomos.github.io/nash-web</text>
</svg>`

await mkdir(new URL('../public/images/', import.meta.url), { recursive: true })
await sharp(Buffer.from(svg)).png().toFile(new URL('../public/images/social-card-web3-ai.png', import.meta.url).pathname)
