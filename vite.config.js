import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Pre-render the certificate background at build time.
//
// The master template is a 3437×2551 / ~1.8MB PNG. We downscale it once here
// and emit a compact JPEG as a build asset. The runtime then draws only this
// cached background plus the recipient's name — no per-visit multi-MB PNG fetch.
const CERT_WIDTH = 2000 // rendered width in px (keeps text crisp on HiDPI/print)
const CERT_NAME = 'cert-bg.jpg'

function certificateBackground() {
  let assetRef = null
  let buffer = null

  // Render once, lazily, shared by dev + build.
  async function render() {
    if (buffer) return buffer
    const src = resolve(__dirname, 'public/template1.png')
    buffer = await sharp(readFileSync(src))
      .resize({ width: CERT_WIDTH })
      .flatten({ background: '#ffffff' }) // no alpha needed for a flat cert
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer()
    return buffer
  }

  return {
    name: 'certificate-background',

    // Dev server: serve the rendered image on demand.
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.endsWith(`/${CERT_NAME}`)) return next()
        const buf = await render()
        res.setHeader('Content-Type', 'image/jpeg')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(buf)
      })
    },

    // Build: emit as a real asset and remember its final hashed URL.
    async buildStart() {
      const buf = await render()
      assetRef = this.emitFile({
        type: 'asset',
        name: CERT_NAME,
        source: buf
      })
    },

    // Hand the final URL + intrinsic size to the client bundle.
    resolveId(id) {
      if (id === 'virtual:cert-bg') return '\0virtual:cert-bg'
    },
    load(id) {
      if (id !== '\0virtual:cert-bg') return
      const height = Math.round((CERT_WIDTH * 2551) / 3437)
      // In dev there is no emitted asset; the middleware serves a stable path.
      const url =
        assetRef != null
          ? `__VITE_ASSET__${assetRef}__`
          : `/cptbcpt/${CERT_NAME}`
      return `export default ${JSON.stringify({ url, width: CERT_WIDTH, height })}`
    }
  }
}

export default defineConfig({
  plugins: [react(), certificateBackground()],
  base: '/cptbcpt/',
})
